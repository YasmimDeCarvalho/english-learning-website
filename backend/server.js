require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const crypto = require("crypto");


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

        const cancelToken = crypto.randomUUID();

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
                placement_time,
                cancel_token
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                student_name,
                student_age,
                parent_phone,
                placement_date,
                placement_time,
                cancelToken
            ]
        );

        res.status(201).json({
            message: "Placement agendado com sucesso!",
            placement_id: result.insertId,
            cancel_token: cancelToken
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
            AND status IN ('pending', 'confirmed')
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

// ==============================
// GET PLACEMENT BY CANCEL TOKEN
// ==============================

app.get("/placements/manage/:token", async (req, res) => {
    try {
        const { token } = req.params;

        const [rows] = await db.query(
            `
            SELECT
                student_name,
                placement_date,
                placement_time,
                status
            FROM placements
            WHERE cancel_token = ?
            `,
            [token]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Agendamento não encontrado."
            });
        }

        const placement = rows[0];

        res.json({
            student_name: placement.student_name,
            placement_date: placement.placement_date,
            placement_time: placement.placement_time.substring(0, 5),
            status: placement.status
        });

    } catch (error) {
        console.error("Erro ao buscar placement:", error);

        res.status(500).json({
            message: "Erro ao buscar o agendamento."
        });
    }
});

// ==============================
// CONFIRM PLACEMENT
// ==============================

app.patch("/placements/confirm/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(
            `
            UPDATE placements
            SET status = 'confirmed'
            WHERE id = ?
            AND status = 'pending'
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Pré-agendamento não encontrado ou já confirmado."
            });
        }

        res.json({
            message: "Agendamento confirmado com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao confirmar placement:", error);

        res.status(500).json({
            message: "Erro ao confirmar o agendamento."
        });
    }
});



// ==============================
// CANCEL PLACEMENT
// ==============================

app.patch("/placements/cancel/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { cancellation_reason } = req.body;

        const [result] = await db.query(
            `
            UPDATE placements
            SET
            status = 'cancelled',
            cancellation_reason = ?,
            cancelled_at = CURRENT_TIMESTAMP
            WHERE cancel_token = ?
            AND status IN ('pending', 'confirmed')
            `,
            [
                cancellation_reason || null,
                token
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Agendamento não encontrado ou já cancelado."
            });
        }

        res.json({
            message: "Agendamento cancelado com sucesso!"
        });

    } catch (error) {
        console.error("Erro ao cancelar placement:", error);

        res.status(500).json({
            message: "Erro ao cancelar o agendamento."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});