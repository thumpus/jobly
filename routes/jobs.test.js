"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************ POST /jobs  */

describe("POST /jobs", function() {
    const newJob = {
        title: "new",
        salary: 10,
        equity: 0,
        company_handle: "c1"
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toMatchObject({
            job: {
                title: "new",
                salary: 10,
                equity: "0",
                companyHandle: "c1"
            },
        });
    });

    test("not ok for not admin", async function() {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "new",
                salary: "butts",
                equity: "0",
                companyHandle: "c1",
            })
        expect(resp.statusCode).toEqual(401);
    });
});

/********************************* GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toMatchObject({
            jobs:
            [
                {
                    title: "j1",
                    salary: 40000,
                    equity: "0.5",
                    company_handle: "c1"
                },
                {
                    title: "j2",
                    salary: 50000,
                    equity: "0.6",
                    company_handle: "c2"
                },
                {
                    title: "j3",
                    salary: 60000,
                    equity: "0.7",
                    company_handle: "c3"
                }
            ]
        })
    })

})

/************************** GET /jobs/:id */

describe("GET /jobs/:id", function() {
    test("works for anon", async function() {
        const jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        const resp = await request(app).get(`/jobs/${jobId.rows[0].id}`).set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toMatchObject({
            job: {
                title: "j1",
                salary: 40000,
                equity: "0.5",
                company_handle: "c1"
            }
        })
    })

    test("not found for no such job", async function() {
        const resp = await request(app).get(`/jobs/0`).set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    })
})

/********************* PATCH /jobs/:id */

describe("PATCH /jobs/:id", function() {
    test("works for admin", async function() {
        const jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        const response = await request(app)
            .patch(`/jobs/${jobId.rows[0].id}`)
            .send({
                title: "j1-new"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(response.body).toEqual({
            job: {
                id: jobId.rows[0].id,
                title: "j1-new",
                salary: 40000,
                equity: "0.5",
                company_handle: "c1"
            }
        })
    });

    test("doesn't work for non-admin", async function(){
        const jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        const response = await request(app)
            .patch(`/jobs/${jobId.rows[0].id}`)
            .send({
                title: "j1-new"
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(response.statusCode).toEqual(401);
    });

    test("doesn't work with no such job", async function(){
        const response = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "j1-new"
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(response.statusCode).toEqual(404);
    });

    test("doesn't work with invalid data", async function() {
        const jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        const response = await request(app)
            .patch(`/jobs/${jobId.rows[0].id}`)
            .send({
                title: 40
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(response.statusCode).toEqual(400);
    })
})

/****************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function() {
    test("works for admin", async function() {
        const jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        const response = await request(app)
            .delete(`/jobs/${jobId.rows[0].id}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(response.body).toEqual({ deleted: `job id: ${jobId.rows[0].id}` });
    });

    test("doesn't work for non-admin", async function() {
        const jobId = await db.query(`SELECT id FROM jobs WHERE title = 'j1'`)
        const response = await request(app)
            .delete(`/jobs/${jobId.rows[0].id}`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(response.statusCode).toEqual(401); 
    })

    test("not found for no such company", async function() {
        const response = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(response.statusCode).toEqual(404);
    })
})