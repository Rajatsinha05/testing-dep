const express=require('express');
const app=express();
const port=3000;
app.get('/', (req, res) => {
    res.send("Welcome to the Express server")
})
app.listen(port,()=>{
    console.log("listening on port 3000");
    
}); 