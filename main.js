require.config({
    paths: {
        "jquery": 'bower_components/jquery/dist/jquery.min',
        "jquery.bootstrap": 'bower_components/bootstrap/dist/js/bootstrap.min',
        "ukulele": 'build/js/ukulele',
        "highlight": 'bower_components/highlightjs/highlight.pack',
        "locale": 'resources/locale/example_properties',
        "routejs": 'bower_components/uku-routejs/build/js/uku-route',
        "domReady": 'bower_components/domReady/domReady'
    },
    shim:{
    	
		"ukulele":{
            exports:"Ukulele"
        },
        "routejs":{
            exports:"Route"          
        },
    	"jquery.bootstrap":{
    		deps:["jquery"]
    	}
    }
});

require(["domReady","routejs","ukulele","MyController","MyController2","jquery","jquery.bootstrap","highlight","locale"], function(domReady,Route,Ukulele,MyController,MyController2) {

	var ishljsInitial = false;
	var uku;
    var route;
	domReady(function() {
		uku = new Ukulele();
		uku.registerController("myCtrl", new MyController(uku));
        uku.registerController("myCtrl2", new MyController2(uku));
        uku.registerController("res",new ResourceManager());
		uku.init();
		uku.refreshHandler = function(){
			if(!ishljsInitial){
				$('pre code').each(function(i, block) {
				    hljs.highlightBlock(block);
				});
				ishljsInitial = true;
			}			
		};
        
        var route = new RouteController("viewContainer");
        route.onRouteChange = function(page){
            if(page && page.page && !page.cache){
                uku.dealWithElement(page.page);
            }
        };
        route.default("#home","pages/home.html")
        .when("#example","pages/example.html")
        .when("#performance","pages/performance.html")
        .when("#api","pages/api.html")
        .when("#about","pages/about.html")
        .otherwise("pages/home.html")
        .work();
	});
    
    function ResourceManager(){    
        this.changeLocale = function(language){
            this.selectedLanguage = language;
        };
        this.languages = [{"name":"中文","value":"zh_CN"},{"name":"English","value":"en_US"}];
        this.selectedLanguage = this.languages[0];
        this.getResource = function(key){
            var currentLocale = this.selectedLanguage.value;
            var str = locale[currentLocale][key];
            return str;
        };
    }
});

define("MyController2",function(){
    return function(uku){
        this.myName = "name from MyController2";   
    };
});

define("MyController",function(){
	function Child() {
		this.name = undefined;
		this.say = function() {
			return "Hi, " + this.name;
		};
	}
	
	return function(uku) {
			this.message = "";
			this.myName = "please input your name";
			this.sayHello = function() {
				alert(this.myName);
			};
			this.sayHelloWithArgument = function(name) {
				alert("Hi," + name);
			};
			
			this.sayHelloWithString = function(str) {
				alert(str);
			};
	
			this.sayHelloWithInstanceArgument = function(instance) {
				alert("Hi," + instance.name);
			};
	
			this.sayHelloWith2Argument = function(name, name2) {
				alert("Hi," + name + " and " + name2);
			};
			this.numA = 2;
			this.numB = 3;
			this.add = function(num1, num2) {
				var sum = num1 + num2;
				return sum;
			};
			
			this.showInfo = function(object) {
				return object.myName;	
			};
			
			this.showString = function(str) {
				return str;
			};
			
			this.items = [
				{
					"name" : "Kamaka HF-1",
					"imgUrl": "example/images/hf1.jpg",
					"subModels" : [{"name" : "HF-1 basical version"},{"name" : "HF-1 with pickup"}]
				}, {
					"name" : "Kamaka HF-2",
					"imgUrl": "example/images/hf2.jpg",
					"subModels" : [{"name" : "HF-2 basical version"},{"name" : "HF-2 with pickup"}]
				}, {
					"name" : "Kamaka HF-3",
					"imgUrl": "example/images/hf3.jpg",
					"subModels" : [{"name" : "HF-3 basical version"},{"name" : "HF-3 with pickup"}]
				}];
			this.child = new Child();
			
			this.syncData = "will show json from sync request";
			var self = this;
			this.callSync = function(){
				$.get("resources/data/data.json",function(data,status){
					self.syncData = data.name;
					uku.refresh();
				});
			};
			 
			this.options = [
				{"name":"Kamaka","value":"kamaka","children":[
					{"name":"HF1"},{"name":"HF2"},{"name":"HF3"}
				]},
				{"name":"Koaloha","value":"koaloha","children":[
					{"name":"KSM"},{"name":"KCM"},{"name":"KTM"}
				]},
				{"name":"Kanilea","value":"kanilea","children":[
					{"name":"K1S"},{"name":"K2C"},{"name":"K1T"}
				]},
				{"name":"Koolau ","value":"koolau","children":[
					{"name":"CS Tenor"},{"name":"Model 100"},{"name":"Tenor Deluxe"}
				]}
			];
			this.selectedOption = this.options[2];
			this.selectedChildOption = this.selectedOption.children[0];
			
			this.selectedOptionChanged = function(){
				this.selectedChildOption = this.selectedOption.children[0];	
				uku.refresh();
			};
            this.isCheckboxSelected = true;
            this.sex = "female";
		};
});