npm init

npm i --save-exact express@.... tải framework express cho dự án

sequelize orm khong can viet lenh sql thuan
sequelize-cli

mysql2

cors

dotenv

tạo .env và .env.example 

tao config/config.js
require('dotenv').config();
module.exports = {
  development: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME || "rozerzone-project",
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || "mysql",
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME_TEST || "database_test",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    username: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME_PROD || "database_production",
    host: process.env.DB_HOST || "127.0.0.1",
    dialect: "mysql"
  }
};

npx sequelize-cli init

tao .squelizerc

cd nodejs 

node_modules/.bin/sequelize init

tao user.js 
npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string
