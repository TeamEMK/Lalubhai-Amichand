-- ===== Lallubhai Amichand — initial schema + data =====
-- Generated: 2026-05-22T10:54:21.997Z
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS fms_steps;
DROP TABLE IF EXISTS fms;
DROP TABLE IF EXISTS profile;
DROP TABLE IF EXISTS holidays;
DROP TABLE IF EXISTS masters;
DROP TABLE IF EXISTS delegations;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id          VARCHAR(16)  NOT NULL PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL UNIQUE,
  phone       VARCHAR(64)  DEFAULT '',
  department  VARCHAR(128) DEFAULT '',
  roles       VARCHAR(128) DEFAULT 'User',
  active      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE delegations (
  id            VARCHAR(16)  NOT NULL PRIMARY KEY,
  description   TEXT         NOT NULL,
  doer_id       VARCHAR(16)  NULL,
  doer          VARCHAR(255) NOT NULL DEFAULT '',
  delegated_by  VARCHAR(16)  NULL,
  due_date      DATE         NULL,
  client        VARCHAR(255) DEFAULT '',
  status        ENUM('pending','done','revise') NOT NULL DEFAULT 'pending',
  type          VARCHAR(32)  NOT NULL DEFAULT 'delegation',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_del_doer (doer),
  INDEX idx_del_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE masters (
  id           VARCHAR(16)  NOT NULL PRIMARY KEY,
  task         TEXT         NOT NULL,
  assigned_to  VARCHAR(255) DEFAULT '',
  frequency    VARCHAR(32)  NOT NULL DEFAULT 'Daily',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE holidays (
  id     VARCHAR(16)  NOT NULL PRIMARY KEY,
  date   DATE         NOT NULL,
  name   VARCHAR(255) NOT NULL,
  type   VARCHAR(64)  DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fms (
  id            VARCHAR(16)  NOT NULL PRIMARY KEY,
  client_name   VARCHAR(255) NOT NULL,
  platforms     TEXT         DEFAULT NULL,
  mobile        VARCHAR(64)  DEFAULT '',
  doer          VARCHAR(255) DEFAULT '',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE fms_steps (
  fms_id      VARCHAR(16) NOT NULL,
  step_index  INT         NOT NULL,
  planned     DATETIME    NULL,
  actual      DATETIME    NULL,
  PRIMARY KEY (fms_id, step_index),
  FOREIGN KEY (fms_id) REFERENCES fms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE profile (
  user_id             VARCHAR(16)  NOT NULL PRIMARY KEY,
  notification_email  VARCHAR(255) DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;

-- users: 32 rows
INSERT INTO users (id,name,email,phone,department,roles,active,created_at) VALUES
  ('U001','Abhishek Jain','abhishek@e-marketing.io','9602684444','CXO','Admin',1,'2026-05-21 12:04:31'),
  ('U002','Akhilesh Vyas','vyas.akhilesh@e-marketing.io','7048462985','Business Automation','Admin,HOD',1,'2026-05-21 12:04:31'),
  ('U003','Akshita Jain','jain.akshita@e-marketing.io','7340302359','Social Media','User',1,'2026-05-21 12:04:31'),
  ('U004','Aman Bejal','bejal.aman@e-marketing.io','6376724283','Graphic Designing','User',1,'2026-05-21 12:04:31'),
  ('U005','Aman Pareek','pareek.aman@e-marketing.io','7507905684','Business Automation','Admin,User',1,'2026-05-21 12:04:31'),
  ('U006','Ankit Ladha','ladha.ankit@e-marketing.io','7737270516','Google Ads','User',1,'2026-05-21 12:04:31'),
  ('U007','Ashish Jha','seo@e-marketing.io','9024736048','SEO','User',1,'2026-05-21 12:04:31'),
  ('U008','Bhanu Sharma','sharma.bhanu@e-marketing.io','9351842255','SEO','User',1,'2026-05-21 12:04:31'),
  ('U009','Chetna Agrawal','chetna@e-marketing.io','8238999732','CXO','User',1,'2026-05-21 12:04:31'),
  ('U010','Ching Thakral','googlexecutive@e-marketing.io','9988716423','Google Ads','User',1,'2026-05-21 12:04:31'),
  ('U011','Divvy Jain','jain.divvy@e-marketing.io','8769533770','Meta Ads','User',1,'2026-05-21 12:04:31'),
  ('U012','Divya Srivastava','srivastava.divya@e-marketing.io','9001798754','Graphic Designing','User',1,'2026-05-21 12:04:31'),
  ('U013','Garvit Kedia','kedia.garvit@e-marketing.io','9782800257','Meta Ads','User',1,'2026-05-21 12:04:31'),
  ('U014','Gaurav Gupta','gupta.gaurav@e-marketing.io','9155836021','Website Design & Development','User',1,'2026-05-21 12:04:31'),
  ('U015','Harsh Daharwal','daharwal.harsh@e-marketing.io','9596896449','Business Automation','Admin,User',1,'2026-05-21 12:04:31'),
  ('U016','Kritika Saini','saini.kritika@e-marketing.io','8696482750','Google Ads','User',1,'2026-05-21 12:04:31'),
  ('U017','Kushagra Dubey','dubey.kushagra@e-marketing.io','8203058282','Meta Ads','User',1,'2026-05-21 12:04:31'),
  ('U018','Mohit Kumawat','kumawat.mohit@e-marketing.io','6290552269','Content Writing','User',1,'2026-05-21 12:04:31'),
  ('U019','Nikita Khandelwal','khandelwal.nikita@e-marketing.io','8306660792','MDO','Admin,User',1,'2026-05-21 12:04:31'),
  ('U020','Nisha Madaan','madaan.nisha@e-marketing.io','9988820092','Google Ads','User',1,'2026-05-21 12:04:31'),
  ('U021','Nupur Kothari','kothari.nupur@e-marketing.io','9314050398','Graphic Designing','User',1,'2026-05-21 12:04:31'),
  ('U022','Pradhuman Kumar','pradhuman@e-marketing.io','7973006643','Google Ads','HOD',1,'2026-05-21 12:04:31'),
  ('U023','Priya Saini','saini.priya@e-marketing.io','9652295500','SEO','User',1,'2026-05-21 12:04:31'),
  ('U024','Purvi Saini','saini.purvi@e-marketing.io','9301878061','MDO','Admin,User',1,'2026-05-21 12:04:31'),
  ('U025','Rahul Maharchandani','maharchandani.rahul@e-marketing.io','8302671330','AI','HOD',1,'2026-05-21 12:04:31'),
  ('U026','Ritu Tilokani','tilokani.ritu@e-marketing.io','9772779351','Content Writing','HOD',1,'2026-05-21 12:04:31'),
  ('U027','Sakshi Saini','sakshi.saini@e-marketing.io','9530000022','Google Ads','User',1,'2026-05-21 12:04:31'),
  ('U028','Satish Khichi','khichi.satish@e-marketing.io','9530000023','Google Ads','User',1,'2026-05-21 12:04:31'),
  ('U029','Saurav Pareek','pareek.saurav@e-marketing.io','9530000024','Social Media','User',1,'2026-05-21 12:04:31'),
  ('U030','Swati Joshi','joshi.swati@e-marketing.io','9530000025','Content Writing','User',1,'2026-05-21 12:04:31'),
  ('U031','Tushar Chauhan','chauhan.tushar@e-marketing.io','9530000026','Website Design & Development','User',1,'2026-05-21 12:04:31'),
  ('U032','Vishal Jaga','mis1@e-marketing.io','00756492939','MDO','Admin',1,'2026-05-21 12:04:31');

-- delegations: 9 rows
INSERT INTO delegations (id,description,doer_id,doer,delegated_by,due_date,client,status,type,created_at) VALUES
  ('DEL001','Need to automate the Advance Qualified Leads data (Last 90 Days in the Google Sheet)','U002','Akhilesh Vyas','U001','2026-04-08','','pending','delegation','2026-05-21 12:04:31'),
  ('DEL002','Need to Connect the Google ads account to the Claude.ai','U002','Akhilesh Vyas','U001','2026-04-07','','pending','delegation','2026-05-21 12:04:31'),
  ('DEL003','Start Curiosity based ads','U029','Saurav Pareek','U001','2026-04-08','','pending','delegation','2026-05-21 12:04:31'),
  ('DEL004','Ads Video Start for GLP','U029','Saurav Pareek','U001','2026-04-11','','pending','delegation','2026-05-21 12:04:31'),
  ('DEL005','3 new shoot videos- Ads to be started including GLP','U029','Saurav Pareek','U001','2026-04-21','','pending','delegation','2026-05-21 12:04:31'),
  ('DEL006','Content for new video in which we have to write high value offer and content for summer play also...','U026','Ritu Tilokani','U001','2026-04-22','Hero Play','pending','delegation','2026-05-21 12:04:31'),
  ('DEL007','Create google form and tasks - Employee Onboarding Process','U032','Vishal Jaga','U001','2026-05-04','','pending','delegation','2026-05-21 12:04:31'),
  ('DEL008','Speed is slow','U028','Satish Khichi','U001','2026-05-05','','pending','delegation','2026-05-21 12:04:31'),
  ('DEL009','Google review widget on home page','U028','Satish Khichi','U001','2026-05-06','','pending','delegation','2026-05-21 12:04:31');

-- masters: 4 rows
INSERT INTO masters (id,task,assigned_to,frequency,created_at) VALUES
  ('CHK001','Daily Standup Meeting','All HODs','Daily','2026-05-21 12:04:31'),
  ('CHK002','Weekly Client Report','Account Managers','Weekly','2026-05-21 12:04:31'),
  ('CHK003','Monthly Budget Review','Pradhuman Kumar','Monthly','2026-05-21 12:04:31'),
  ('CHK004','Quarterly Performance Review','All Employees','Monthly','2026-05-21 12:04:31');

-- holidays: 5 rows
INSERT INTO holidays (id,date,name,type) VALUES
  ('HOL001','2026-01-26','Republic Day','National'),
  ('HOL002','2026-03-14','Holi','Festival'),
  ('HOL003','2026-08-15','Independence Day','National'),
  ('HOL004','2026-10-02','Gandhi Jayanti','National'),
  ('HOL005','2026-11-08','Diwali','Festival');

-- fms: 0 rows

-- fms_steps: 0 rows

INSERT INTO profile (user_id, notification_email) VALUES ('U032', 'yourrealemail@gmail.com');