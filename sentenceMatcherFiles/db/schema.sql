CREATE DATABASE sentencematching;
USE sentencematching;

-- Create a burgers table with the required fields --
CREATE TABLE questions
(
	id int NOT NULL AUTO_INCREMENT
	question varchar(300) NOT NULL,
	correctEmotion integer,
-- columns for question and id of correct emotion
  	PRIMARY KEY(id)
);

CREATE TABLE emotions
(
	id int NOT NULL AUTO_INCREMENT
	emotion varchar(25) NOT NULL,
-- column for emotion
  	PRIMARY KEY(id)
);