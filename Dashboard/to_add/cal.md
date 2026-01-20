Calendar component:
	- React.JS Component
	- Integrations: Google Cal, Apple Cal, other calendar/scheduling apps, Local tasks component
	- Backend/Neo4J graph databse setup?
	
	Functions: 
		- Create, Edit, update, delete calendar events
		- Ability to tag, color code, and organize event (ltots of project based work) 
		- Ability to specify start and end datetime as well as a title, location, and notes or relevant links 
		- Synchronize across platforms (2-way)
		- Automate creating tasks/subtasks for events
	UI:
	- d3.js for visualization
	- typical calendar views (2 month, month, week, day) as well as a circular rrpresentation similar to a pie chart)
		- Ability toadd subtasks to calendar entries (will shup up as a second layer out on the circular chart)

	proposed JSON
	{
		"event1" : {
			"title" : "",
			"project" : "",
			"tags" : {"","","",.....},
			"startDate" : "",
			"startTime" : "",
			"endDate" : "",
			"endTime" : "",
			"location" : "",
			"notes" : {
				note1:"",
				note2:"",
				note...:"",
				link1:"",
				link2:"",
				link...:""
			}
			"origin" : "",
			"priority" : "",
			"tasks" : {... (see task component json)},
			"isCompleted" : ""
		}
	}
To do component:
	- React.JS Component
	- Integrations: Local Calendar Component
	- Backend/NEO4J graph database setup?
	
	Functions: 
		- Create, Edit, update, delete tasks events as well as any subtasks
		- Ability to tag, color code, and organize tasks and subtask types (ltots of project based work)
		- Ability to sort taks by priority, project, start/end date
		- Ability to specify task as well as any subtasks start and end datetime as well as a title, due date, priority level, and notes or relevant links  
		- Synchronize with local Calendar component and database
		- Automate creating subtasks
		- Automate schyronizing with todo.md and important documentation systemwide
		- Create a list of suggested tasks to add to the todos
	UI:
	- Ability to create add sections for new projects. 
	- Drag and drop entries to sort them
	- Ability to create headers for projects
	- Ability to check boxes to complete tasks/subtasks 


	proposed JSON
	{
		"task1" : {
			"title" : "",
			"project" : "",
			"tags" : {"","","",.....},
"			"dueDate" : "",
			"startDate" : "",
			"startTime" : "",
			"endDate" : "",
			"endTime" : "",
			"location" : "",
			"notes" : {
				note1:"",
				note2:"",
				note...:"",
				link1:"",
				link2:"",
				link...:""
			}
			"origin" : "",
			"calendarEvent" : "",
			"priority" : "",
			"subtasks" : {... (see component json)},
			"isComplete" : ""
		}
	}