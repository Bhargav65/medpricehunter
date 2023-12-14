const { MongoClient } = require('mongodb');
const express = require('express');
const app = express();
const port=3000;
const path=require('path');
const bodyparser=require('body-parser');
const puppeteer=require('puppeteer')
const url = 'mongodb+srv://WebScraping:987654321@cluster0.gufq3zz.mongodb.net/';
const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect((err) => {
  if (err) {
      console.log('Error connecting to MongoDB Atlas', err);
      return;
  }
  console.log('Connected to MongoDB Atlas');
  db = client.db("Details").collection("User");
});

app.use(express.json()); 
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname));


app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(bodyparser.json({limit:'130mb'}));
app.use(bodyparser.urlencoded({limit:'130mb',extended:true}));

app.get('/landing',(req,res)=>{
    res.sendFile(path.join(__dirname+'/index.html'));
})

app.get('/signup',(req,res)=>{
    res.sendFile(path.join(__dirname+'/signup.html'));
})
app.get('/search',(req,res)=>{
    res.sendFile(path.join(__dirname+'/search.html'));
})

app.get('/signin',(req,res)=>{
    res.sendFile(path.join(__dirname+'/signin.html'));
})




  
app.post('/signup', async(req,res)=>{
   console.log(req.body);
    const Email=req.body.Email;
    const password=req.body.Password;
    const doc=await db.findOne({Email:Email});
    if(!doc){
        const newUser={
            Email:Email,
            Password:password
        }
        db.insertOne(newUser,(err,result)=>{
            if(err){
                console.log("Error inserting user into database");
                return res.status(500).json({error:'Internal server error'});

            }else{
                res.redirect('/signin');
            }
        })
    }

})

app.post('/signin',async(req,res)=>{
    const Email=req.body.Email;
    const doc=await db.findOne({Email:Email});
    if(doc){
        res.sendFile(path.join(__dirname+'/search.html'));
    }else{
        res.send("User Not Found")
    }
})






app.use(express.json());





app.post('/search', async (req, res) => {
  const medicine = req.body.search;
  console.log(medicine);
  const websiteUrlpharm = `https://pharmeasy.in/search/all?name=${medicine}`;
  const websiteUrlnet = `https://www.netmeds.com/catalogsearch/result/${medicine}/all`;

  (async () => {
    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: true });

    const page = await browser.newPage();
    await page.goto(websiteUrlpharm);

    //const html = await page.content();
    const datapharm = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('.ProductCard_medicineName__8Ydfq'));
     
      const prices = Array.from(document.querySelectorAll('.ProductCard_ourPrice__yDytt'));
    
      const medicineNames = elements.map(element => element.textContent.trim());
      const medicinePrices = prices.map(priceElement => priceElement.textContent.trim());
    
      const categoryLinks = Array.from(document.querySelectorAll('.ProductCard_medicineUnitWrapper__eoLpy.ProductCard_defaultWrapper__nxV0R'));
      const hrefs = categoryLinks.map(link => link.getAttribute('href'));
    
      return {
        medicineNames: medicineNames,
        medicinePrices: medicinePrices,
        hrefs: hrefs,
      };
    });


   const pagenet = await browser.newPage();
   await pagenet.goto(websiteUrlnet);
   const datanet = await pagenet.evaluate(async() => {
      const elements = Array.from(document.querySelectorAll('span.clsgetname'));
      const prices1 = Array.from(document.querySelectorAll('span.final-price'));
      const prices = Array.from(document.querySelectorAll('#final_price'));
    
    
      const medicineNames = elements.map(element => element.textContent.trim());
      const medicinePrices = prices.map(priceElement => priceElement.textContent.trim());
      const medicinePrices1 = prices1.map(priceElement1 => priceElement1.textContent.trim());
    
      const categoryLinks = Array.from(document.querySelectorAll('.category_name'));
      const hrefs = categoryLinks.map(link => link.getAttribute('href'));
    
      return {
        medicineNames: medicineNames,
        medicinePrices: medicinePrices,
        medicinePrices1:medicinePrices1,
        hrefs: hrefs,
      };
    });


    
    await browser.close();
    const pharm=datapharm.medicineNames;
    const pharmhref=datapharm.hrefs;
    const pharmprices=datapharm.medicinePrices;
    const finpharmind=[];
    const finpharmname=[];
    const finpharmhref=[];
    
    var ind;
    for(const i of pharm){
      const lowercaseMainString = i.toLowerCase();
      const lowercaseSearchString = medicine.toLowerCase();
      if(lowercaseMainString.includes(lowercaseSearchString)){
            ind=pharm.indexOf(i);
            finpharmind.push(pharmprices[ind]);
            finpharmname.push(i);
            finpharmhref.push(pharmhref[ind]);
          
            break

      }
    }
    
    var finnetind = [];

if (datanet.medicinePrices1.length === 0) {
  finnetind = datanet.medicinePrices;
} else if (datanet.medicinePrices.length === 0) {
  finnetind = datanet.medicinePrices1;
}
    const finnetname=datanet.medicineNames;
    const finnethref=datanet.hrefs;
    var medicinelink;
    var medicineprice;
    var medicinename
    if(finnetind[0]>finpharmind[0]){
      medicinelink="https://pharmeasy.in"+finpharmhref[0]
      medicineprice=finpharmind[0]
      medicinename=finpharmname[0];
    }else{
      medicinelink="https://www.netmeds.com"+finnethref[0]
      medicineprice=finnetind[0];
      medicinename=finnetname[0];
    }
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <style>
      body {
        font-family: Arial, sans-serif;
      }
  
      .card {
        width: 500px;
        height: 500px;
        margin: 0 auto;
        background-color: skyblue;
        border-radius: 8px;
        z-index: 1;
      }
  
      .tools {
        display: flex;
        align-items: center;
        padding: 9px;
      }
  
      .circle {
        padding: 0 4px;
      }
  
      .box {
        display: inline-block;
        align-items: center;
        width: 10px;
        height: 10px;
        padding: 1px;
        border-radius: 50%;
      }
  
      .red {
        background-color: #ff605c;
      }
  
      .yellow {
        background-color: #ffbd44;
      }
  
      .green {
        background-color: #00ca4e;
      }
  
      .card__content {
        padding: 20px;
      }
  
      #pharmacyData {
        margin: 0;
        color: #333;
      }
  
      #pharmacyData a {
        color: #0066cc;
        text-decoration: none;
      }
  
      #pharmacyData a:hover {
        text-decoration: underline;
      }
      </style>
    </head>
    <body>
      <center>
        <h1>Result...</h1>
      </center>
      <div class="card">
        <div class="tools">
          <div class="circle">
            <span class="red box"></span>
          </div>
          <div class="circle">
            <span class="yellow box"></span>
          </div>
          <div class="circle">
            <span class="green box"></span>
          </div>
        </div>
        <div class="card__content">
        <center>
          <p id="pharmacyData">
          <a href=${medicinelink}>Medicine link</a>
          <br>
          ${medicinename}
          <br>
          ${medicineprice}
          </p>
        </center>
          <a href
        </div>
      </div>
    </body>
    </html>
  `);
  ;

  })();

});

const PORT = process.env.PORT || 3000;



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});