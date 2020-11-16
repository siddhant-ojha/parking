var express = require('express');
var mysql = require('mysql');
const app = express();
const _ = require('lodash')
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: 'Admin@1234',
    database: 'Platform3solutions'
});

connection.connect();

var cors = require('cors');
var corsOptions = {
    credentials: true,
    origin: ["http://localhost:3000", "http://localhost:20002", "http://platform3solutions.in", "http://www.platform3solutions.in"],
    origin: function (origin, callback) {
        callback(null, true)
    },
    allowedHeaders: "Accept, Origin, X-Requested-With, X-Auth-Token, X-Auth-Userid, Authorization, Content-Type, Cache-Control, X-Session-ID, Access-Control-Allow-Origin, x-app-version, X-GEO-TOKEN, X-Geo-Token, x-geo-token, x-device-token",
};
app.use(cors(corsOptions));
app.options("*", cors());

app.get('/', function (req, res) {
    res.send('Atm Module')
});

app.get('/availableparking', function (req, res) {
    // res.send('Available Balance')
    connection.query(`Select * from ATMBalance where id =${req.headers.id} `, function (err, result, fields) {
        // throe error from mysql
        if (err) throw err;
        // return error if user does not exists 
        if (!result.length) res.status(400).send({ message: "user not found" });

        console.log(result);
        res.status(200).send({ message: "Balance fetched Successfully", balance: result[0].Balance });
    });
});

// db promise wrapper
function mysqlPromise(query) {
    return new Promise((resolve, reject) => {
        connection.query(query, (err, result) => {
            if (err) return reject(err);
            return resolve(result);
        });
    })
}

app.post('/parkVehicle', async function (req, res) {
    console.log(req.body.data);
    // total space currently available
    let totalAvailableSpace = await mysqlPromise(`select Space from parkingSpace`);
    totalAvailableSpace = totalAvailableSpace[0].Space;

    const totalVehicleSize = await mysqlPromise(`select * from Vehicleinfo`);

    let totalSpaceRequired = 0;

// itterate each req vehicale to cal required space
    req.body.data.forEach((obj)=>{
        totalSpaceRequired += (obj.count * _.filter(totalVehicleSize,{"Name": obj.vehicle})[0].Size);
    })

    if (totalAvailableSpace < totalSpaceRequired) {
        return res.status(400).send({message:"Insuffient space"})
    }

    // update current available space

    await mysqlPromise(`update parkingSpace set Space=${totalAvailableSpace-totalSpaceRequired}`);

    return res.status(200).send({message:`Success! total consumed ${totalSpaceRequired} current available ${totalAvailableSpace-totalSpaceRequired}`})

    // 5 object db in one query [{"vehicle":"truck","size":100}]
    // itterate total size of vehicles to be parked 

    // const availableParkingSpace = await mysqlPromise(`select Space from parkingSpace`);
    // console.log(availableParkingSpace, '**')

});

app.listen(4646);
console.log('App listening on port 4646')