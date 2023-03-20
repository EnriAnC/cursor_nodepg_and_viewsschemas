const express = require('express');
const app = express()
const cors = require('cors')
const { Pool } = require('pg')
const Cursor = require('pg-cursor')
const { promisify } = require("util") ;

app.use(cors())

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'evfinal07'
  })



app.route('/paises/:q/:p/:filtercolumn/:filtertype/:getmax')
    .get((req,res)=>{
        (async ()=>{
            try {
                const { q, p, filtercolumn, filtertype, getmax } = req.params
                const client = await pool.connect() 
                let query = 'SELECT * from paisesindicenombreasc where rowNo > $1' // la tabla paisesindicenombreasc es una vista de la tabla paises join paises_pib enumerado por nombre en ascendente
                if (filtercolumn === "nombre"){
                    if (filtertype === "asc") query = 'SELECT * from paisesindicenombreasc where rowNo > $1'
                    if (filtertype === "desc") query = 'SELECT * from paisesindicenombredesc where rowNo > $1'
                }
                if (filtercolumn === "poblacion"){
                    if (filtertype === "asc") query = 'SELECT * from paisesindicepoblacionasc where rowNo > $1'
                    if (filtertype === "desc") query = 'SELECT * from paisesindicepoblaciondesc where rowNo > $1'
                }
                let lengthTable = false; 
                if (getmax == 1) lengthTable = await client.query('select MAX(rowNo) from paisesindicenombreasc')
                const cursor = client.query(new Cursor(query, [p]))
                Cursor.prototype.readAsync = promisify(Cursor.prototype.read)
                let rows = await cursor.readAsync(q)
                console.log(rows)
                cursor.close()
                client.release()
                if (getmax == 1) return res.status(200).json({rows, max:lengthTable.rows[0].max, cantFilas: q, desdeLaFila:p})
                return res.status(200).json(rows)
                
            } catch (err) {
                res.status(404).send(err)
            }
        })()
    })

app.delete('/paises/:nombre', (req, res)=>{
    (async ()=>{
        const client = await pool.connect()
        try {
            const nombre = req.params.nombre
            await client.query('BEGIN')
            await client.query('delete from paises_pib where nombre = $1;', [nombre])
            await client.query('delete from paises where nombre = $1;', [nombre])
            await client.query('INSERT INTO paises_data_web VALUES ($1,$2)', [nombre, 0])
            await client.query('COMMIT')
            res.json({msg: "Se ha eliminado correctamente", nombre:nombre})
        } catch (err) {
            await client.query('ROLLBACK')
            res.status(404).send(err)
        } finally {
            client.release()
        }
    })()
})

app.route('/paises')
    .post(express.json(), (req,res)=>{
        (async ()=>{
            const client = await pool.connect()
            const {nombre, continente, poblacion, pib_2019, pib_2020} = req.body
            try {
                await client.query('BEGIN')
                await client.query('INSERT INTO paises VALUES ($1,$2,$3)', [nombre, continente, poblacion])
                await client.query('INSERT INTO paises_pib VALUES ($1,$2,$3)', [nombre, pib_2019, pib_2020])
                await client.query('INSERT INTO paises_data_web VALUES ($1,$2)', [nombre, 1])
                await client.query('COMMIT')
                res.status(200).json({msg:"Se ha insertado correctamente", datos:req.body})
            } catch (err) {
                await client.query('ROLLBACK')
                res.status(404).send(err)
            } finally {
                client.release()
            }
            
        })()
    })
app.listen(3000)