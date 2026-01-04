import express, {Request, Response} from "express";
import {Pool} from "pg";
import dotenv from "dotenv";
import path from "path"

dotenv.config({path: path.join(process.cwd(), ".env")});

const app = express();
const port = 5000;

//connection pool
const pool = new Pool({
  connectionString: `${process.env.CONNECTION_STR}`,
}); 

const initDB = async () => {
  await pool.query(`
        CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        age INT,
        phone VARCHAR(15),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);


        await pool.query(`
          CREATE TABLE IF NOT EXISTS todos(
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT,
          completed BOOLEAN DEFAULT false,
          due_date DATE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
          )
          `)

};


initDB();


(async () => {
  try {
    const res = await pool.query("SELECT 1");
    console.log("DB connected:", res.rows);
  } catch (e) {
    console.error("DB connection failed:", e);
  }
})();

//parser
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello next World!');
});

//users crud
// post route 
app.post("/users", async (req: Request, res: Response) => {
    const {name, email} = req.body;


    try{
      const result = await pool.query(`INSERT INTO users(name, email) VALUES($1, $2) RETURNING *`, [name, email]);
      
      res.status(201).json({
        success: false,
        message: "data inserted succesfully",
        data: result.rows[0],
      });
      

    }catch(err: any){
      res.status(500).json({
        success: false,
        message: err.message
      })

    }
    

    
});


//get route
app.get("/users", async(req: Request, res: Response ) => {

  try{

    const result = await pool.query(`SELECT * FROM users`);

    res.status(200).json({
      success: true,
      message: "users retrieved successfully",
      data: result.rows
    })

  }catch(err: any){
    res.status(500).json({
      success: false,
      message: err.message,
      details: err
    })

  }
})


app.get("/users/:id", async(req: Request, res: Response) => {
  // console.log(req.params);
  // res.send({messege: "api is cool...."})

  try{
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.params.id])
    if(result.rows.length === 0){
      res.status(404).json({
        success: false,
        message: "user not found",
      })
    } else {
      res.status(200).json({
        success: true,
        message: "user fetched successfully",
        data: result.rows[0]
      })
    }
  }catch(err: any){
    res.status(500).json({
      success: false,
      messege: err.message,
    })
  }
})


app.put("/users/:id", async(req: Request, res: Response) => {

  const {name, email} = req.body

  try{
    const result = await pool.query(`UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *`,[name, email, req.params.id])
    if(result.rows.length === 0){
      res.status(404).json({
        success: false,
        message: "user not found",
      })
    } else {
      res.status(200).json({
        success: true,
        message: "user updated successfully",
        data: result.rows[0]
      })
    }
  }catch(err: any){
    res.status(500).json({
      success: false,
      messege: err.message,
    })
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
