const express = require('express');
const cors = require('cors');
// const session = require('express-session');
const bodyParser = require('body-parser');
const projectTypeRouters = require('./src/routers/projectTypeRouters');
const projectDetailRouters = require('./src/routers/projectDetailRouters');
const roleRouters = require('./src/routers/roleRouters');
const userRouters = require('./src/routers/userRouters');
const loginRouters = require('./src/routers/loginRouters');
const receiptsAndExpenseRouters = require('./src/routers/receiptsAndExpenseRouters')
const predictRouters = require('./src/routers/predictRouters');


const app = express();
// enable all request(Cross-Origin Resource Sharing)
app.use(cors());
// enable body of request 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//define router
app.use('/api', projectTypeRouters);
app.use('/api', roleRouters);
app.use('/api', userRouters);
app.use('/api', loginRouters);
app.use('/api', receiptsAndExpenseRouters);
app.use('/api', projectDetailRouters);
app.use('/api', predictRouters);

app.listen(5000, () => console.log('Api app listening on port 5000!'));
