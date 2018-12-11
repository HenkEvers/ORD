App = {
    web3Provider: null,
    contracts: {},
  
    initWeb3: function() {
  
      // Check if an injected web3 instance is running
      if (typeof web3 !== 'undefined') {
        App.web3Provider = web3.currentProvider;
      } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
        App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      }
      web3 = new Web3(App.web3Provider);
  
      return App.initContracts();
    },
  
    initContracts: function() {
      
      // Instantiate the contract artifacts
      $.getJSON('Register.json', function(data) {
        var Register = data;
        App.contracts.Register = TruffleContract(Register);
        App.contracts.Register.setProvider(App.web3Provider);
      });
      
      $.getJSON('CreateStorage.json', function(data) {
        var CreateStorage = data;
        App.contracts.CreateStorage = TruffleContract(CreateStorage);
        App.contracts.CreateStorage.setProvider(App.web3Provider);
      });

      $.getJSON('Process.json', function(data) {
        var Process = data;
        App.contracts.Process = TruffleContract(Process);
        App.contracts.Process.setProvider(App.web3Provider);
      });

      return App.registerButton();
    },
  
    // If you press the button then get the address of the register contract
    registerButton: function() {
      $(document).on('click', '#buttoncontract', App.registerAddress);
    },
    
    registerAddress: function() {
  
      var RegisterInstance;
  
      App.contracts.Register.deployed().then(function(instance) {
          RegisterInstance = instance;
          return RegisterInstance.getContractAdress.call();
        }).then(function(result) {
          return App.createStorageContract(result);
        }).catch(function(err) {
          console.log(err.message);
        });    
    },
    
    // Create a storage contract
    createStorageContract: function(AddressRegisterContract) {
      
      var AddressRegisterContract;
      
      // Get the adress of the first account on the test network and use it to run the next transaction
      web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      };
    
      var account = accounts[0];
  
      var CreateStorageInstance;
  
      App.contracts.CreateStorage.deployed().then(function(instance) {
        CreateStorageInstance = instance;
        
        // Create a new contract 
        var NameContract = $("#namecontract").val(); 
        return CreateStorageInstance.createContract(NameContract, AddressRegisterContract, {from: account});
        }).then(function(result) {
        
          // Freeze input field to create a contract
          $("#namecontract").attr("readonly",true);
          // Disable the button to create a contract
          $("#buttoncontract").attr("disabled", true);
          $("#buttoncontract").attr("id", "btndisabled");
          // Unfreeze the fields to define a contract object
          $("#clone_1").find(".form-control").attr("readonly",false);
          // Enable the button to add an an object to the contract
          $("#clone_1").find("#buttoncontract_object").attr("disabled", false);
          // Return js object to add input to the contract
          var adressStorageContract = result.logs[0].args.newStorageContract
          return App.addInput(adressStorageContract);
  
        }).catch(function(err) {
          console.log(err.message);
        });
      });
    },
  
    addInput: function(adressStorageContract) {
  
      // Address of the created storage contract
      var addressStorageContract = adressStorageContract
  
      // Run function if you click the  button
      $(document).on("click","#buttoncontract_object", function(){
         
        // Data from the input fields
        var nameObject =  $(this).parents(".object").find("#nameobject").val()
        var initialValue =  $(this).parents(".object").find("#initialvalue").val()
        var unitofMeasurement = $(this).parents(".object").find("#unitofmeasurement").val()
      
        // Fields to freeze and buttons to disable
        var fields = $(this).parents(".object").find(".form-control")
        var button = $(this).parents(".object").find("#buttoncontract_object")
        var remove = $(this).parents(".object")
        
        // First run the function to add the initial input values if succesfull callback and change the screen lay-out
        App.setValues(addressStorageContract,nameObject,initialValue,unitofMeasurement, function() {
      
          // Freeze the fields to define a contract object
          fields.attr("readonly",true);
          // Disable the button to add an an object to the contract
          button.attr("disabled", true);
          // Disable the option to remove this input field row
          remove.attr("id", "clone_1");
  
        }) 
      });
    },
  
    // Function to add the initial input values
    setValues: function (address, name, value, uom, callback) {
     
      // Get the adress of the first account on the test network and use it to run the next transaction
      web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      };
        
      var account = accounts[0];
      
      var ProcessInstance;
      
      App.contracts.Process.deployed().then(function(instance) {
        ProcessInstance = instance;
        return ProcessInstance.setMeasurementInStorageContractI(address, name, value, uom, {from: account});
        }).then(function(result) {
          callback();
        }).catch(function(err) {
          console.log(err)
        });
      });
    },
  
  } 
  
  // Initate the app object
  $(document).ready(function() {
    App.initWeb3(); 
  });
  
  // Add and remove rows to enter initial input values, but only after the contract is created
  $(document).ready(function(){
  
    var counter = 1;
    var secondcounter = 0;
    
    $(document).on("click",".addobject", function(){
      if($(".namecontract").find("#btndisabled").is(':disabled')) { 
        var lastElement = $(".object").last()
        var newobject = $("#clone_1").clone().attr("id", "clone_" + ++counter).insertAfter(lastElement);
        newobject.find(".form-control").attr("readonly",false);
        newobject.find("#buttoncontract_object").attr("disabled", false);
      } 
    });
  
    $(document).on("click",".removeobject", function(){
      var removenewobject = $(this).parents(".object")
      if (removenewobject.get(0).id !== "clone_1") removenewobject.remove();
    });
  
  });  