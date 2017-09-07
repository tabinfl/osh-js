/***************************** BEGIN LICENSE BLOCK ***************************

 The contents of this file are subject to the Mozilla Public License, v. 2.0.
 If a copy of the MPL was not distributed with this file, You can obtain one
 at http://mozilla.org/MPL/2.0/.

 Software distributed under the License is distributed on an "AS IS" basis,
 WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 for the specific language governing rights and limitations under the License.

 Copyright (C) 2015-2017 Mathieu Dhainaut. All Rights Reserved.

 Author: Mathieu Dhainaut <mathieu.dhainaut@gmail.com>

 ******************************* END LICENSE BLOCK ***************************/

OSH.UI.Panel.StylerMarkerPanel = OSH.UI.Panel.StylerPanel.extend({
    initialize:function(parentElementDivId, options) {
        this._super(parentElementDivId, options);
    },

    initPanel:function() {
        // tab panel
        var tabPanel = new OSH.UI.Panel.TabPanel();

        // tab elements
        this.locationPanel = new OSH.UI.Panel.LocationPanel("",{datasources:this.options.datasources, styler:this.options.styler});
        this.iconPanel = new OSH.UI.Panel.IconPanel("",{datasources:this.options.datasources,styler:this.options.styler});

        tabPanel.addTab("Location",this.locationPanel.div);
        tabPanel.addTab("Icon",this.iconPanel.div);

        this.div.appendChild(tabPanel.div);
    },

    loadStyler:function(styler){
        if(!isUndefinedOrNull(styler.properties) && !isUndefinedOrNull(styler.properties.ui)){

            if(!isUndefinedOrNull(styler.properties.ui.location)) {
                this.locationPanel.loadData(styler.properties.ui.location);
            }

            if(!isUndefinedOrNull(styler.properties.ui.icon)) {
                this.iconPanel.loadData(styler.properties.ui.icon);
            }
        }
    },

    getStyler:function() {
        // concats properties from all tabs
        var uiProperties = { datasources: this.options.datasources, icon: {}, location:{}};

        // copy properties from panels
        OSH.Utils.copyProperties(this.iconPanel.getProperties(),uiProperties.icon);
        OSH.Utils.copyProperties(this.locationPanel.getProperties(),uiProperties.location);

        var stylerProps = OSH.UI.Styler.Factory.createMarkerStylerProperties(uiProperties);
        this.options.styler.initProperties(stylerProps);

        this.options.styler.properties.ui = uiProperties;

        return this.options.styler;
    }
});