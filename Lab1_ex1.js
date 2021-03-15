"use strict";

const dayjs = require('dayjs');
const sqlite = require('sqlite3');

// open the db
const db = new sqlite.Database('tasks.db',
    (err) => {if(err) throw err;})


// define an object Task
function Task(id, description, urgent=false, priv=true, deadline=null){
    this.id = id;
    this.description = description;
    this.urgent = urgent;
    this.private = priv;
    if (deadline != null){
        this.deadline = dayjs(deadline).format('MMMM D, YYYY h:mm A');
    }
    else
        this.deadline = '<not defined>';

    this.toString = () => (`Id: ${this.id}, Description: ${this.description}, Urgent: ${this.urgent}, Private: ${this.private}, Deadline: ${this.deadline}`);
}

function TaskList(){
    this.tasks = [];

    this.addTask = (task) => {
        this.tasks.push(task);
    }

    this.sortAndPrint = () => {
        // Custom sort function that leaves the not defined deadline as last position
        this.tasks.sort(function(t1, t2){
            if (t1.deadline !== '<not defined>' && t2.deadline !== '<not defined>'){
                return (dayjs(t1.deadline).isAfter(dayjs(t2.deadline)) ? 1:-1);
            }
            if (t1.deadline === '<not defined>'){
                return 1;
            }
            if (t2.deadline === '<not defined>'){
                return -1;
            }
            return 0;
        })            
            
        console.log(this.tasks.toString());
    }

    this.filterAndPrint = () => {
        let filteredTasks = this.tasks.filter(task => task.urgent == true);
        console.log(filteredTasks.toString());
    }


    this.toString = () => (this.tasks.map((task) => (task.toString())).join('\n'));

}

const t2 = new Task(2, 'monday lab', false, false, 'March 16, 2021 10:00 AM');
const t3 = new Task(1, 'laundry', false, true, null);
const t1 = new Task(3, 'phone call', true, false, 'March 8, 2021 4:20 PM');


let taskList = new TaskList();
//taskList.addTask(t2);
//taskList.addTask(t3);
//taskList.addTask(t1);


//console.log(t1.toString());
console.log(taskList.toString());
//console.log('\n'+'******' + 'Task sorted by deadline (most recent first):******')
//taskList.sortAndPrint();
//console.log('\n'+'******' + 'Task filtered, only (urgent == true):******')
//taskList.filterAndPrint();


//load all the dbs task in the list

function insertAllFromDb() {

    const sql = 'SELECT * FROM tasks';

    return new Promise( (resolve, reject) => {
        db.all(sql, (err, rows) => {
            if (err) {
                reject(err);
            }               
            else {
                for (let row of rows){
                    let task = new Task(
                        row.id,
                        row.description,
                        row.urgent,
                        row.private,
                        row.deadline
                    );
                    taskList.addTask(task);
                }

                resolve(taskList);
            }
        })
    })
}

function searchByDeadline(deadline){
    const sql = "SELECT * FROM tasks WHERE deadline > ?";

    return new Promise( (resolve, reject) => {
        db.all(sql, [deadline], (err, rows) => {
            if (err) {
                reject(err);
            }               
            else {

                let list = new TaskList();

                for (let row of rows){
                    let task = new Task(
                        row.id,
                        row.description,
                        row.urgent,
                        row.private,
                        row.deadline
                    );
                    list.addTask(task);
                }

                resolve(list);
            }
        })
    })    
}


function searchByKeyword(keyword){
    let likeKeyword = '%'+keyword+'%';
    const sql = "SELECT * FROM tasks WHERE description LIKE ?";

    return new Promise( (resolve, reject) => {
        db.all(sql, [likeKeyword], (err, rows) => {
            if (err) {
                reject(err);
            }               
            else {

                let list = new TaskList();

                for (let row of rows){
                    let task = new Task(
                        row.id,
                        row.description,
                        row.urgent,
                        row.private,
                        row.deadline
                    );
                    list.addTask(task);
                }

                resolve(list);
            }
        })
    })  

}

async function main(){
    await insertAllFromDb();
    console.log('*** Tasks inserted ***');
    console.log(taskList.toString());
    let deadlineList = await searchByDeadline('2021-03-10');
    console.log('\n**** Tasks after '+dayjs('2021-03-10').format('MMMM D, YYYY h:mm A')+' ****')
    console.log(deadlineList.toString());
    let wordList = await searchByKeyword('lab');
    console.log('\n**** Tasks which contains the word "lab":****')
    console.log(wordList.toString());
}

main();





