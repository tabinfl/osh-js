OSH.UI.View = Class.create({
    initialize: function (divId, viewItems,options) {
        // list of stylers
        this.stylers = [];
        this.contextMenus = [];
        this.viewItems = [];
        this.names = {};
        this.stylerToObj = {};
        this.stylerIdToStyler = {};
        this.lastRec = {};
        this.selectedDataSources = [];
        this.dataSources = [];

        //this.divId = divId;
        this.id = "view-" + OSH.Utils.randomUUID();

        this.dataSourceId = -1;
        // sets dataSourceId
        if(typeof(options) != "undefined" && typeof(options.dataSourceId) != "undefined") {
            this.dataSourceId = options.dataSourceId;
        }

        if(typeof(options) != "undefined" && typeof(options.entityId) != "undefined") {
            this.entityId = options.entityId;
        }
        this.css = "";

        this.cssSelected = "";

        if(typeof(options) != "undefined" && typeof(options.css) != "undefined") {
            this.css = options.css;
        }

        if(typeof(options) != "undefined" && typeof(options.cssSelected) != "undefined") {
            this.cssSelected = options.cssSelected;
        }

        // inits the view before adding the viewItem
        this.init(divId,viewItems,options);
    },

    init:function(divId,viewItems,options) {
        this.elementDiv = document.createElement("div");
        this.elementDiv.setAttribute("id", this.id);
        this.elementDiv.setAttribute("class", this.css);

        this.divId = this.id;

        var div = document.getElementById(divId);
        if (divId == null || div == "undefined" || div == null || divId == "") {
            document.body.appendChild(this.elementDiv);
            this.hide();
            this.container = document.body;
        } else {
            div.appendChild(this.elementDiv);
            this.container = div;
        }

        this.beforeAddingItems(options);

        if (typeof (viewItems) != "undefined") {
            for (var i =0;i < viewItems.length;i++) {
                this.addViewItem(viewItems[i]);
            }
        }

        if(typeof (options) != "undefined") {
            if(typeof (options.show) != "undefined") {
                document.getElementById(this.divId).style.display = (options.show)? "block": "none";
            }
        }
        this.handleEvents();

        // observes the event associated to the dataSourceId
        if(typeof(options) != "undefined" && typeof(options.dataSourceId) != "undefined") {
            OSH.EventManager.observe(OSH.EventManager.EVENT.DATA+"-"+options.dataSourceId, function (event) {
                this.setData(options.dataSourceId, event.data);
            }.bind(this));
        }

        var self = this;
        var observer = new MutationObserver( function( mutations ){
            mutations.forEach( function( mutation ){
                // Was it the style attribute that changed? (Maybe a classname or other attribute change could do this too? You might want to remove the attribute condition) Is display set to 'none'?
                if( mutation.attributeName === 'style') {
                    self.onResize();
                }
            } );
        } );

        // Attach the mutation observer to blocker, and only when attribute values change
        observer.observe( this.elementDiv, { attributes: true } );
    },

    hide: function() {
        this.elementDiv.style.display = "none";
    },

    onResize:function() {
    },

    attachTo : function(divId) {
        if(typeof this.elementDiv.parentNode != "undefined") {
            // detach from its parent
            this.elementDiv.parentNode.removeChild(this.elementDiv);
        }
        document.getElementById(divId).appendChild(this.elementDiv);
        if(this.elementDiv.style.display == "none") {
            this.elementDiv.style.display = "block";
        }
    },

    beforeAddingItems: function (options) {

    },

    getId: function () {
        return this.id;
    },

    getDivId: function () {
        return this.divId;
    },

    setData: function(dataSourceId,data) {},

    show: function(properties) {
    },

    shows: function(properties) {
    },
    /**
     * Add viewItem to the view
     */
    addViewItem: function (viewItem) {
        this.viewItems.push(viewItem);
        if (viewItem.hasOwnProperty("styler")) {
            var styler = viewItem.styler;
            this.stylers.push(styler);
            if (viewItem.hasOwnProperty("name")) {
                this.names[styler.getId()] = viewItem.name;
            }
            styler.init(this);
            styler.viewItem = viewItem;
            this.stylerIdToStyler[styler.id] = styler;
        }
        if (viewItem.hasOwnProperty("contextmenu")) {
            this.contextMenus.push(viewItem.contextmenu);
        }
        //for(var dataSourceId in styler.dataSourceToStylerMap) {
        var ds = styler.getDataSourcesIds();
        for(var i =0; i < ds.length;i++) {
            var dataSourceId = ds[i];
            // observes the data come in
            var self = this;
            (function(frozenDataSourceId) { // use a close here to no share the dataSourceId variable

                OSH.EventManager.observe(OSH.EventManager.EVENT.DATA + "-" + frozenDataSourceId, function (event) {
                    // we check selected dataSource only when the selected entity is not set
                    var selected = false;
                    if (typeof self.selectedEntity != "undefined") {
                        selected = (viewItem.entityId == self.selectedEntity);
                    }
                    else {
                        selected = (self.selectedDataSources.indexOf(frozenDataSourceId) > -1);
                    }

                    //TODO: maybe done into the styler?
                    styler.setData(frozenDataSourceId, event.data, self, {
                        selected: selected
                    });
                    self.lastRec[frozenDataSourceId] = event.data;
                });

                OSH.EventManager.observe(OSH.EventManager.EVENT.SELECT_VIEW, function(event) {
                    // we check selected dataSource only when the selected entity is not set
                    var selected = false;
                    if (typeof event.entityId != "undefined") {
                        selected = (viewItem.entityId == event.entityId);
                    }
                    else {
                        selected = (event.dataSourcesIds.indexOf(frozenDataSourceId) > -1);
                    }

                    if(frozenDataSourceId in self.lastRec) {
                        styler.setData(frozenDataSourceId, self.lastRec[frozenDataSourceId], self, {
                            selected: selected
                        });
                    }
                });

            })(dataSourceId); //passing the variable to freeze, creating a new closure
        }
    },

    handleEvents: function() {
        // observes the selected event
        OSH.EventManager.observe(OSH.EventManager.EVENT.SELECT_VIEW,function(event){
            this.selectDataView(event.dataSourcesIds,event.entityId);
        }.bind(this));

        // observes the SHOW event
        OSH.EventManager.observe(OSH.EventManager.EVENT.SHOW_VIEW,function(event){
            this.show(event);
        }.bind(this));
    },

    /**
     * Should be called after receiving osh:SELECT_VIEW event
     * @param $super
     * @param dataSourcesIds
     * @param entitiesIds
     */
    selectDataView: function (dataSourcesIds,entityId) {
        if(typeof this.dataSources != "undefined") {
            this.selectedDataSources = dataSourcesIds;
            // set the selected entity even if it is undefined
            // this is handled by the setData function
            this.selectedEntity = entityId;
            for (var j = 0; j < this.dataSources.length; j++) {
                this.setData(this.dataSources[j], this.lastRec[this.dataSources[j]]);
            }
        }
    },

    getDataSourcesId: function() {
        var res = [];
        if(this.dataSourceId != -1) {
            res.push(this.dataSourceId);
        }

        // check for stylers
        for(var i = 0; i < this.viewItems.length;i++) {
            var viewItem = this.viewItems[i];
            if (viewItem.hasOwnProperty("styler")) {
                var styler = viewItem.styler;
                res = res.concat(styler.getDataSourcesIds());
            }
        }

        return res;
    }
});