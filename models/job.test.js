"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const { update } = require("./job.js");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/********************* create */

describe("create", function() {
    const newJob = {
        title: "new",
        salary: 40000,
        equity: "0",
        company_handle: "c1"
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS "companyHandle"
            FROM jobs
            WHERE title = 'new'`);
        
        expect(result.rows).toMatchObject([
            {
                title: "new",
                salary: 40000,
                equity: "0",
                companyHandle: "c1"
            }
        ])
    });
})

/******************* findAll */

describe("findAll", function() {
    test("works", async function(){
        let jobs = await Job.findAll();
        expect(jobs).toMatchObject([
            {
                title: "j1",
                salary: 150000,
                equity: "0.5",
                company_handle: "c1"
            },
            {
                title: "j2",
                salary: 25000,
                equity: "0.01",
                company_handle: "c2"
            }
        ])
    })
})

/******************** get */

describe("get" , function(){
    test("works", async function(){
        let jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        let job = await Job.get(jobId.rows[0].id);
        expect(job).toEqual({
            id: jobId.rows[0].id,
            title: "j1",
            salary: 150000,
            equity: "0.5",
            company_handle: "c1"
        })
    })

    // this might not work the first time you do it if j1 somehow gets an id of 0.
    // if you run it again it should work.
    test("not found if no such company.", async function() {
        try {
            await Job.get("0");
            fail();
        } catch (err){
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})

/************************** update */

describe("update", function() {
    const updateData = {
        title: "newJob",
        salary: 1,
        equity: "0",
        company_handle: "c2"
    };
    

    test("works", async function() {
        let jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        let job = await Job.update(jobId.rows[0].id, updateData);
        expect(job).toEqual({
            id: jobId.rows[0].id,
            ...updateData,
        });

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
             FROM jobs
             WHERE id = ${jobId.rows[0].id}`);
        expect(result.rows).toEqual([{
            id: jobId.rows[0].id,
            title: "newJob",
            salary: 1,
            equity: "0",
            company_handle: "c2"
        }]);  
    });

    test("not found if no such job", async function() {
        try {
            await Job.update("0", updateData);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function() {
        let jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        try {
            await Job.update(jobId.rows[0].id, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
})

/********************* remove */

describe("remove", function() {
    test("works", async function() {
        let jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        await Job.remove(jobId.rows[0].id);
        const result = await db.query(
            `SELECT id FROM jobs WHERE id = ${jobId.rows[0].id}`
        )
        expect(result.rows.length).toEqual(0);
    })

    test("not found if no such job", async function() {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    })
})