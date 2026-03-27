/* <copyright>
 * 
 * IBM Confidential 
 * OCO Source Materials
 * 5725A15
 * (c) Copyright IBM Corp. 2010,2017
 * 
 * The source code for this program is not published or otherwise divested of
 * its trade secrets, irrespective of what has been deposited with
 * the U.S. Copyright Office.
 * 
 * </copyright> 
 */

define(function () {

	var AcmGlobal = {
		// Reference of SolutionHomw Widget
		solutionHome				: null,
		designerHome				: null,
		// Reference of first invalid field
		invalidField				: null
		propsDetails				: null,
		
		// Reference of ActivityEditor Widget
		activityEditor				: null,

		_solutionList				: null,
		
		INTEGRATION_TYPE			: "P8",
		NEXUS_URL					: "/navigator",
		WORKPLACE_XT_URL			: "/WorkplaceXT",
		
		// to enable PD Plugin URL on ICN based on the CPE Level given by
		// the property ENABLE_PD_PLUGIN in config
		// file
		
		ENABLE_PD_PLUGIN            : "",
		
		// to hide or display PD applets link
		ENABLE_PD					: "",
		
		// to enable case auto completion based on the CPE Level given by
		// the property ENABLE_AUTO_COMPLETE_WHEN_CASE_COMPLETES in config
		// file
		ENABLE_CASE_AUTO_COMPLETE	: "",
		
		// to enable Business Objects based on the CPE Level given by
		// the property ENABLE_BUSINESS_OBJECTS in config
		// file
		ENABLE_BUSINESS_OBJECTS	: "",
		
		// Save JSON data store
		saveData					: {},
		readOnlyLock : false,
		templateReadOnly			: false,
		sdflocked					: false,
		pecfglocked					:false,
		CSTYPE_WRKWROUND			: 0,
		CSTYPE_WRKWROUND1			: 0,
		CSTYPE_CASEPREFIX			: 0,
		myLocks						:[],
		myViews						:[],
		myRules						:[],
		lockedrules					:[],
		lockedCaseTypes				:[],
		lockdatafortasks			:[],
		pagelckexists 				:false,
		_lockedviews				:[],
		enableCaseFeatures			:false,
		slnLayoutNames				:[],
		slnLayoutSymNames			:[],
		caseViewNames				:[],
		caseViewSymNames			:[],
		
		 setEnablePdPluginFlag : function(enablePdPlugin) {
		    	var flag = "";
		    		if(enablePdPlugin == null || enablePdPlugin == "" || enablePdPlugin == "null"){
		    			flag = "false";
		    		}else if(enablePdPlugin != null && enablePdPlugin != "" && enablePdPlugin != "null"){	
		    			flag = "true";
		    		}
		    		this.ENABLE_PD_PLUGIN = flag;
		    },
		
	    setAutocaseCompletionEnablingFlag : function(enableCaseComplete) {
	    	var flag = "";
	    		if(enableCaseComplete == null || enableCaseComplete == "" || enableCaseComplete == "null"){
	    			flag = "false";
	    		}else if(enableCaseComplete != null && enableCaseComplete != "" && enableCaseComplete != "null"){	
	    			flag = "true";
	    		}
	    		this.ENABLE_CASE_AUTO_COMPLETE = flag;
	    },
	    
	    setBOEnablingFlag : function(enableBO) {
	    	var flag = "";
	    		if(enableBO == null || enableBO == "" || enableBO == "null"){
	    			flag = "false";
	    		}else if(enableBO != null && enableBO != "" && enableBO != "null"){	
	    			flag = "true";
	    		}
	    		this.ENABLE_BUSINESS_OBJECTS = flag;
	    },
	    
		getLocalizedPageName: function(page){
	        var localizedName = NLS.getString(page.getName()+"_TITLE");
	        if(!localizedName) localizedName = page.getName();
	        return localizedName;
		},
		
		getLocalizedPageDescription: function(page){
			var localizedDescription = NLS.getString(page.getName()+"_DESC");
	        if(!localizedDescription) localizedDescription = page.getDescription();
	        return localizedDescription;
		},
			
		setDefaultRoleStaticPages: function(pSolutionModel, pRoleModel, pManualAdd)
	    {
	    	var arr = pSolutionModel.getPages();
			var defaultPageArr = [];
	    	var tempRolePageObj = null;
	    	for(var j=0; j<arr.length; j++){
		    	var item = arr[j];	
	    		if (((item.getContainmentName() === (pSolutionModel.getPrefix() + "_" + "CmAcmCASES_DEFAULT_PAGE")) || 
	    				(item.getContainmentName() === (pSolutionModel.getPrefix() + "_" + "CmAcmWORK_DEFAULT_PAGE"))) &&
	    				(item.getType() == "CmAcm_STATIC_DEFAULT_PAGE")){
	    			tempRolePageObj = new acm.model.RolePage();
	    			tempRolePageObj.setPage(item);
		    		tempRolePageObj.setParentModel(pRoleModel);
		    		tempRolePageObj.setName(item.getName());
					if(pManualAdd)
					{
						//fix to make sure cases are first solution page by default for newly added role
						if((item.getContainmentName() === (pSolutionModel.getPrefix() + "_" + "CmAcmCASES_DEFAULT_PAGE")))
						{							
							
							if(ACM.isBAStudio)
							{
								// Create Cases Solution Layout
								var pageObj = new acm.model.SolutionLayout();
								pageObj._name = pageObj._displayName = "Cases";
								pageObj._description = NLS.getString("DEFAULT_SOLUTION_PAGE_ROLE_DESC");
								pageObj._containmentName = pSolutionModel.getPrefix() + "_" + "Default_CASE_SLN_LAYOUT";
								pageObj._symbolicName = "Default_CASE_SLN_LAYOUT";
								pageObj._slnAdapterPage = "CmAcmSOLUTION_PAGE_ADAPTER";
								pageObj._layoutType = "solutioncases";
								
								tempRolePageObj = new acm.model.RolePage();
								tempRolePageObj.setPage(pageObj);
								tempRolePageObj.setParentModel(pRoleModel);
								tempRolePageObj.setName(pageObj._name);
							}
							
							defaultPageArr[0] = tempRolePageObj;
						}
						else if((item.getContainmentName() === (pSolutionModel.getPrefix() + "_" + "CmAcmWORK_DEFAULT_PAGE")))
						{
							
							if(ACM.isBAStudio)
							{
								// Create Tasks Solution Layout
								var pageObj2 = new acm.model.SolutionLayout();
								pageObj2._name = pageObj2._displayName = "Tasks";
								pageObj2._description = NLS.getString("DEFAULT_SOLUTION_WORK_PAGE_ROLE_DESC");
								pageObj2._containmentName = pSolutionModel.getPrefix() + "_" + "Default_WORK_SLN_LAYOUT";
								pageObj2._symbolicName = "Default_WORK_SLN_LAYOUT";
								pageObj2._slnAdapterPage = "CmAcmSOLUTION_PAGE_ADAPTER";
								pageObj2._layoutType = "solutionwork";
								
								tempRolePageObj = new acm.model.RolePage();
								tempRolePageObj.setPage(pageObj2);
								tempRolePageObj.setParentModel(pRoleModel);
								tempRolePageObj.setName(pageObj2._name);
							}
							
							defaultPageArr[1] = tempRolePageObj;
						}
						
					}
					else
					{
						pRoleModel.addRolePage(tempRolePageObj);
					}
	    		}
	    	}
			if(pManualAdd){
				for(var i=0; i<defaultPageArr.length; i++){
					pRoleModel.addRolePage(defaultPageArr[i]);
				}
			}
	    },
		
		setSolutionList: function(pSolutionList)
		{
			this._solutionList = pSolutionList;
		},

	    isSolutionExists: function(pName)
	    {
	    	if(this._solutionList){
				var lSolList = this._solutionList.getWrappers();
		    	for (var i = 0, l = lSolList.length; i < l ; i++)
		     	{
		     		if(pName == lSolList[i].getSolutionModel().getName())
		     		{
		     			return true;
		     		}     			
				}
	    	}
	     	return false;
	    },
	    
   	    /**
		 * Message bar update
		 */
	    updateMessageBar: function(msg,title,openMessageBarAutomatically) {    	    	
	    	var displayMessage="";
	    	
	    	if (title) {
	        	for (var i=0; i<msg.length; i++) {
	        		displayMessage += (msg[i]+"<br/>");    	    	
	        	}   	        	
	    	} else {
	    		displayMessage = msg;
	    	}
	    	
	    	var newLine = new RegExp("\n", 'g');
	    	displayMessage = displayMessage.replace(newLine, "<br/>");
			
	    	this.SolHomeStatusBar.set('title', title);
	    	this.SolHomeStatusBar.set('content',displayMessage);
	    	
	    	if(openMessageBarAutomatically && !this.SolHomeStatusBar.get('open')){
	        		this.SolHomeStatusBar.toggle();   // open manage sol
														// status bar to show
														// deployment logs
	        		this.designerHome.messagePaneClicked();
	    	}
	    },
	
	    updateMessageBarWithMultiLines: function(msg, title) {
	    	messages = [];
	    	messages = msg.split("\n");
	    	var displayMessage = "";
	    	var dir = (biDirection)?"rtl":"ltr";
	    	var lrm = "&lrm;";
	    	if(messages.length > 0){
	    		for (var i=0; i<messages.length; i++) {
	    			if(biDirection)
	    			{
	    				messages[i] = messages[i].replace("FNRPA","&rlm;FNRPA");
	    				messages[i] = "<span dir=\""+dir+"\">" + messages[i] +lrm + "</span>"; 
	    			}
	    			else
	    				messages[i] = "<span dir=\""+dir+"\">" + messages[i] + "</span>"; 
	    			displayMessage += (messages[i]+"<br/>");
	    		}
	    	}
	    	
	    	this.SolHomeStatusBar.set('title', title);
	    	this.SolHomeStatusBar.set('content',displayMessage);    
	    	
	    	if(!this.SolHomeStatusBar.get('open')){
	    		this.SolHomeStatusBar.toggle();
	    		this.designerHome.messagePaneClicked();
	    	}
	    },
		
		focusInvalidField: function()
		{
			if (ACM.invalidField) {
				ACM.invalidField.focus();
				ACM.invalidField = null;
				ACM.success();
			}
		}
	};
	
	return AcmGlobal;
});
