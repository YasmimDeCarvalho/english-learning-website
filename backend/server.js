require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ]
}));

app.use(express.json());

const PORT = 3000;


// ==============================
// MYSQL CONNECTION
// ==============================

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


// ==============================
// TEST ROUTE
// ==============================

app.get("/", (req, res) => {
    res.send("Village & Co. API is running!");
});


// ==============================
// DATABASE TEST
// ==============================

app.get("/db-test", async (req, res) => {

    try {

        const [rows] = await db.query("SELECT 1 AS connected");

        res.json({
            message: "Database connected successfully!",
            result: rows
        });

    } catch (error) {

        console.error("Database connection error:", error);

        res.status(500).json({
            message: "Database connection failed."
        });

    }

});


// ==============================
// START SERVER
// ==============================

app.post("/placements", async (req, res) => {
    try {
        console.log("POST /placements recebido:", req.body);
        const {
            student_name,
            student_age,
            parent_phone,
            placement_date,
            placement_time
        } = req.body;

        if (
            !student_name ||
            !student_age ||
            !parent_phone ||
            !placement_date ||
            !placement_time
        ) {
            return res.status(400).json({
                message: "Todos os campos são obrigatórios."
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO placements (
                student_name,
                student_age,
                parent_phone,
                placement_date,
                placement_time
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                student_name,
                student_age,
                parent_phone,
                placement_date,
                placement_time
            ]
        );

        res.status(201).json({
            message: "Placement agendado com sucesso!",
            placement_id: result.insertId
        });

    } catch (error) {
        console.error("Erro ao criar placement:", error);

        res.status(500).json({
            message: "Erro ao criar o agendamento."
        });
    }
});

// ==============================
// GET BOOKED TIMES
// ==============================

app.get("/placements/booked", async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                message: "A data é obrigatória."
            });
        }

        const [rows] = await db.query(
            `
            SELECT placement_time
            FROM placements
            WHERE placement_date = ?
            AND status = 'scheduled'
            `,
            [date]
        );

        const bookedTimes = rows.map(row =>
            row.placement_time.substring(0, 5)
        );

        res.json({
            date: date,
            booked_times: bookedTimes
        });

    } catch (error) {
        console.error("Erro ao buscar horários ocupados:", error);

        res.status(500).json({
            message: "Erro ao buscar horários disponíveis."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});