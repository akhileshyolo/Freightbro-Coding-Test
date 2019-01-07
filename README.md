**Problem Statement:** 
We want to create a mock server application where dummy APIs can be created and accessed by multiple users. 

Following modules are supposed to be there in the application 
• User registration and login (Admin) 
• Users can create APIs 
• API's will be accessible from internet 

## **Each API must follow following structure:**

**Unique Endpoint**: 
                API's must have unique endpoint so that it should not conflict with another user's API's 
                
**Method TYPE:** At least following methods must be supported 
				 • GET
				 • POST 
				 
**Headers:** 
				  Users can create key-value pair for the headers (max: 2) 
**Body:** 
				  Users can create request body (Type: Json) 
**Reference:** 
				• Postman mock server 
				
**Technology:** 
				Node.js (Express Framework preferred), MongoDB 
We encourage you to add any other feature it you'd like to. Hope this task is fun for you, we look forward to seeing your work. 




**

# Solution:

Created by Akhilesh Yadav.

**

**Tech Stack Used:**

 - Node.js with Express.js 
 - MongoDB 
 - Redis 
 - Jade for Templating
 - Sendgrid Email & nodemailer


**GET /**

.

**POST /signup**

| Field | Type  |
|--|--|
| uname | string |
| email| string |
| passwd | string |


**POST /login**


| Field | Type  |
|--|--|
| uname | string |
| passwd | string |


**GET /confirm-account**

| Content Field| Type  |
|--|--|
| token_id| string |


.

**POST /add-lead**

| Header Field| Type  |
|--|--|
| API_KEY| string |


.
| Field | Type  |
|--|--|
| first_name | String |
| middle_name | String |
| last_name | String |
| email | String |
| phone | String |
| country | String |
| state | String |
| city | String |




**GET /list-lead**

| Header | Type|
|--|--|
| API_KEY | String |


|  Content Field | Type
| -- | --|
| limit | string |
| offset | string |


**GET /user/:id**

| Header Field | Type |
| -- | --|
| API_KEY |String |


