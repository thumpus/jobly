"use strict";

/** routes for jobs */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const { json } = require("body-parser");

const router = new express.Router();

// POST / { job } => { job }

// job should be { title, salary, equity, companyHandle }

// returns { id, title, salary, equity, companyHandle }

// authorization: admin

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job })
    } catch (err) {
        return next(err);
    }
})

// GET / 
//  Gives a list off all companies: [ { id, title, salary, equity, companyHandle }, ...]
//  filter by title, minSalary, hasEquity (true or false)

router.get("/", async function (req, res, next) {
    const query = req.query;
    query.hasEquity = query.hasEquity === "true";
    
    try {
        const jobs = await Job.findAll(query);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
})

// GET /id => { job }

// job is { id, title, salary, equity, company_handle }

// authorization: logged in

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job })
    } catch (err) {
        return next(err);
    }
})

// PATCH /id { field1, field2, ... } => { job }

// patches Job data

// fields can be { title, salary, equity, company_handle }

// returns { id, title, salary, equity, company_handle }

// authorization: admin

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid){
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

// DELETE /id  => { deleted: job id: [id] }

// authorization: admin

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: `job id: ${req.params.id}`});
    } catch (err) {
        return next(err);
    }
})

module.exports = router;