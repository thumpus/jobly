"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {

    //creates a job from data. the data should be { title, salary, equity, companyHandle }.
    //returns { id, title, salary, equity, companyHandle } of created job
    static async create(data) {
        const result = await db.query(`INSERT INTO jobs (title, salary, equity, company_handle)
                                        VALUES ($1, $2, $3, $4)
                                        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
                                    [data.title, data.salary, data.equity, data.company_handle]);
        let job = result.rows[0];
        return job;
    }

    //returns all jobs. no filtering yet
    static async findAll(filters = {}) {
        let query = `SELECT id,
                            title,
                            salary,
                            equity,
                            company_handle
                    FROM JOBS`
        let whereExpressions = [];
        let queryValues = [];

        const { title, minSalary, hasEquity } = filters;

        if (minSalary < 0){
            throw new ExpressError("Salary must be above 0.", 400)
        }

        if (minSalary !== undefined){
            queryValues.push(minSalary);
            whereExpressions.push(`salary >= $${queryValues.length}`);
        }

        if (title !== undefined) {
            queryValues.push(`%${title}%`);
            whereExpressions.push(`title ILIKE $${queryValues.length}`)
        }

        if (hasEquity == true){
            whereExpressions.push(`equity > 0`)
        } 

        if (whereExpressions.length > 0) {
            query += " WHERE " + whereExpressions.join(" AND ")
        };

        query += ` ORDER BY title`;
        const jobsResults = await db.query(query, queryValues);
        return jobsResults.rows;
    }

    //returns a company with a specified id.
    static async get(id) {
        const result = await db.query(
            `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle
            FROM jobs
            WHERE id = $1`,
            [id]);
        
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No Job with ID: ${id}`)
            
        return job;
    }

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
                companyHandle: "company_handle"
            }
        );
        const idVarIdx = "$" + (values.length + 1);
        const querySql = `UPDATE jobs
                            SET ${setCols}
                            WHERE id = ${idVarIdx}
                            RETURNING id,
                                      title,
                                      salary,
                                      equity,
                                      company_handle`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No Job with ID: ${id}`)

        return job;
    }

    static async remove(id) {
        const result = await db.query(
            `DELETE
            FROM jobs
            WHERE id = $1
            RETURNING id`,
            [id]);
        const job = result.rows[0];

        if (!job) throw new NotFoundError(`No Job with ID: ${id}`)
    }
}

module.exports = Job;