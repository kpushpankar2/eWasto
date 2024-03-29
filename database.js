require('dotenv').config();
const mysql = require('mysql2');
const dotenv = require('dotenv');
const moment = require('moment');

const pool = mysql.createPool({
    host: process.env.MYSQL_URI,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

function calculateDistance(lat1, lon1, lat2, lon2) {
    const radLat1 = (Math.PI * lat1) / 180;
    const radLon1 = (Math.PI * lon1) / 180;
    const radLat2 = (Math.PI * lat2) / 180;
    const radLon2 = (Math.PI * lon2) / 180;
  
    const earthRadius = 6371; 
  
    const dLat = radLat2 - radLat1;
    const dLon = radLon2 - radLon1;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;
  
    return distance;
}
  
const authenticate = async (phone, password, role) => {
    if (role === 'user') {
        try {
            const [data] = await pool.query(`SELECT * FROM users WHERE phone = ? AND password = ?`, [phone, password])


            if (data.length > 0) return data; // user found
            else return null; // user not found

        }
        catch (err) {
            console.log(err)
        }
    } else if(role === 'admin'){
        try {
            const [data] = await pool.query(`SELECT * FROM admin WHERE phone = ? AND password = ?`, [phone, password])


            if (data.length > 0) return data; // user found
            else return false // user not found

        }
        catch (err) {
            console.log(err)
        }
    }else {
        try {
            const [data] = await pool.query(`SELECT * FROM eWasteCenter WHERE phone = ? AND password = ?`, [phone, password])
            if (data.length > 0) return data; // user found
            else return false // user not found

        }
        catch (err) {
            console.log(err)
        }
    }
};

const checkCode = async(code) =>{
    try {
        const [data] = await pool.query(`SELECT * FROM users WHERE referral = ?`, [code]);

        if (data.length > 0) return true // user found
        else return false // user not found

    }
    catch (err) {
        console.log(err)
    }
}

const creditPoints = async(user,points) =>{
      try {
        const [data] = await pool.query(`SELECT credits FROM users WHERE name = ?`, [user]);
        let previousCredits = data[0].credits;
        
        await pool.query(`UPDATE  users SET credits = ? WHERE name = ?`, [previousCredits + points, user])
    }
    catch (err) {
        console.log(err)
    }
}

const checkCredits = async(referral,points) =>{
    try {
      console.log(referral + " "+ points);
      const [data] = await pool.query(`SELECT * FROM users WHERE referral = ?`, [referral]);
      let previousCredits = data[0].credits;
      let email = data[0].email;
      
      console.log(data[0]);
      await pool.query(`UPDATE  users SET credits = ? WHERE email = ?`, [previousCredits + points, email])
  }
  catch (err) {
      console.log(err)
  }
}

const getEmail = async(name,password)=>{
    try {
        const [data] = await pool.query(`SELECT email FROM users WHERE name = ? AND password = ?`,[name, password]);
        
        return data;
    }
    catch (err) {
        console.log(err)
    }
}

const test = async() =>{
    try {
      const [data] = await pool.query(`SELECT * FROM recycling_items`);
      
      console.log(data);
  }
  catch (err) {
      console.log(err)
  }
}

const locations = async () => {
    try {
        const [data] = await pool.execute(`SELECT X,Y from  eWasteCenter`)
        if (data.length > 0) return data
        else return null
    }
    catch (err) {
        console.log(err)
    }
}

const nearestCenter = async (x,y)=>{
    try{
        const data = [];
        const [centers] =  await pool.execute(`SELECT * from  eWasteCenter`);
        
        let i = 0;
        let dist = [];
        centers.forEach((center)=>{
            let dx = center.X, dy = center.Y;
            let distance = calculateDistance(x,y,dx,dy);
            dist.push([distance,i]);
            i++;
        })
        dist.sort((a, b) => a[0] - b[0]);
        for(let k = 0;k<3;k++){
            let name = centers[dist[k][1]].name;
            let phone = centers[dist[k][1]].phone;
            let address = centers[dist[k][1]].address;
            let pathD = dist[k][0];
            data.push({name,phone,address,pathD});
        }
        return data;
    }catch{
         return null;
    }
}

module.exports ={
    authenticate,
    checkCode,
    creditPoints,
    getEmail,
    checkCredits,
    locations,
    nearestCenter,
    test
}


