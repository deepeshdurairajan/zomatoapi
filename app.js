let express=require('express');
let app=express();
const bodyParser=require('body-parser');
const cors=require('cors');
const dotenv=require('dotenv');
dotenv.config();
const mongo=require('mongodb');

const MongoClient=mongo.MongoClient;
const mongoUrl="mongodb+srv://test:test123@cluster0.z0jmt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
let port=process.env.PORT || 6800;
var db;
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json())
app.use(cors())
// get route
app.get('/',(req,res)=>{
    res.send("Welcome To Express");
})
app.get('/location',(req,res)=>{
    db.collection(`location`).find().toArray((err,result)=>{
        if(err) throw err
        res.send(result);
    })
})
// restaurent as per state location and acc to mealtype
app.get('/restaurant',(req,res)=>{
    let stateId=Number(req.query.state_id);
    let mealId=Number(req.query.mealtype_id); //when we receive anything from url that is string so convert in number
    let query={}; 
    if(stateId && mealId){
        query={"mealTypes.mealtype_id":mealId,state_id:stateId};
    }
    else if(mealId){
        query={"mealTypes.mealtype_id":mealId};
    }
    else if(stateId){
        query={state_id:stateId};
    }
    console.log(">>>>stateID",stateId);
    console.log(">>>>mealID",mealId);
    db.collection(`restaurant`).find(query).toArray((err,result)=>{
        if(err) throw err
        res.send(result);

    })
})
// Quick search data
app.get('/quicksearch',(req,res)=>{
    db.collection(`quicksearch`).find().toArray((err,result)=>{
        if(err) throw err
        res.send(result);
    })
})

// Restaurent details
app.get(`/restaurant/:id`,(req,res)=>{
    let restID=Number(req.params.id);
    console.log(">>>>restID",restID);
    db.collection(`restaurant`).find({restaurant_id:restID}).toArray((err,result)=>{
        if(err) throw err
        res.send(result);
    })
})
// Option
// app.get(`/details/:id`,(req,res)=>{
//     let restID=req.params.id;
//     restID=mongo.ObjectId(restID);
//     console.log(">>>>restID",restID);
//     db.collection(`restaurent`).find({_id:restID}).toArray((err,result)=>{
//         if(err) throw err
//         res.send(result);
//     })
// })
app.get(`/menu/:id`,(req,res)=>{
    let restID=Number(req.params.id);
    console.log(">>>restID",restID);
    db.collection(`menu`).find({restaurant_id:restID}).toArray((err,result)=>{
        if(err) throw err
        res.send(result);
    })
})

// filter api
app.get(`/filter/:mealId`,(req,res)=>{
    let sort={cost:1};
    let mealID=Number(req.params.mealId);
    let skip=0;
    let limit=10000000000;
    let cuisineid=Number(req.query.cuisine);
    let lcost=Number(req.query.lcost);
    let hcost=Number(req.query.hcost);
    let query={};
    if(req.query.sort){
        sort={cost:req.query.sort};
    }
    if(req.query.skip && req.query.limit){
        skip=Number(req.query.skip);
        limit=Number(req.query.limit);
    }
    if(cuisineid&lcost&hcost){
        query={"cuisines.cuisine_id":cuisineid,
        "mealTypes.mealtype_id":mealID,
        $and:[{cost:{$gt:lcost,$lt:hcost}}]}
    }
    else if(cuisineid){
        query={"cuisines.cuisine_id":cuisineid,"mealTypes.mealtype_id":mealID}
    }else if(lcost&hcost){
        query={$and:[{cost:{$gt:lcost,$lt:hcost}}],"mealTypes.mealtype_id":mealID}
    }
    db.collection('restaurant').find(query).sort(sort).skip(skip).limit(limit).toArray((err,result)=>{
        if(err) throw err
        res.send(result);
    })
})

// Menu on the basis of user selection

// get orders
app.get(`/orders`,(req,res)=>{
    let email=req.query.email;
    let query={};
    if(email){
        query={"email":email}
    }
    db.collection(`Orders`).find(query).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})

// place order Many Orders(post)
app.post(`/placeorder`,(req,res)=>{
    // console.log(req.body);
    db.collection('Orders').insertOne(req.body,(err,result)=>{
        if(err) throw err;
        res.send("Order Added")
    })
})
// Place One Order

// Menuitems On User selection
app.post(`/menuItem`,(req,res)=>{
    // console.log(req.body);
    db.collection('Menu').find({menu_id:{$in:req.body}}).toArray((err,result)=>{
        if(err) throw err;
        res.send(result);
    })
})
// for delete order
app.delete(`/deleteOrder`,(req,res)=>{
    let email=req.query.email;
    let query={}
    if(email){
        query={"email":email}
    }
    db.collection('Orders').deleteOne(query,(err,result)=>{
       if(err) console.log(err)
       res.send(result)
    })
})
// Update Api
app.put('/updateOrder/:id',(req,res)=>{
let oId=mongo.ObjectId(req.params.id)
console.log(">>>_id",oId)
let status=req.query.status?req.query.status:'Pending'
db.collection('Orders').updateOne(
    {_id:oId},
    {$set:{
            "status":status,
            "bank_name":req.body.bank_name,
            "bank_status":req.body.bank_status
        
    }},(err,result)=>{
        if(err) throw err
     
        res.send(`status updated to ${status}`);
        
    }
)
    
})


MongoClient.connect(mongoUrl,(err,connection)=>{
    if(err) throw err
    db=connection.db(`zomato`)
    app.listen(port,()=>{
        console.log(`Listening in port no ${port}` );
    })
})