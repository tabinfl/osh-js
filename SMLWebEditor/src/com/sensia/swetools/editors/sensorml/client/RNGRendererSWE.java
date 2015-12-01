/***************************** BEGIN LICENSE BLOCK ***************************

 The contents of this file are Copyright (C) 2011 Sensia Software LLC.
 All Rights Reserved.
 
 Contributor(s): 
    Alexandre Robin <alex.robin@sensiasoftware.com>
 
 ******************************* END LICENSE BLOCK ***************************/

package com.sensia.swetools.editors.sensorml.client;

import java.util.List;
import java.util.Map;

import com.google.gwt.core.shared.GWT;
import com.sensia.relaxNG.RNGAttribute;
import com.sensia.relaxNG.RNGElement;
import com.sensia.relaxNG.RNGTag;
import com.sensia.relaxNG.RNGTagList;
import com.sensia.relaxNG.RNGTagVisitor;
import com.sensia.relaxNG.RNGValue;
import com.sensia.swetools.editors.sensorml.client.panels.elements.RNGAttributeDefinitionWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.RNGAttributeWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.RNGElementWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.RNGIdentifierWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.RNGValueWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.swe.SWEDataComponentPropertyWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.swe.SWEDataComponentWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.swe.SWEDataFieldWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.swe.SWEDataQuantityWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.swe.SWEDataRecordNameWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.swe.SWEDataRecordUOMWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.swe.SWEDataRecordWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.swe.SWELabeledFieldWidget;
import com.sensia.swetools.editors.sensorml.client.panels.elements.swe.SWEPropertyWidget;

/**
 * <p>
 * <b>Title:</b> RNGRenderer
 * </p>
 *
 * <p>
 * <b>Description:</b><br/>
 * Renders content of an RNG grammar describing SWE Common data components using
 * GWT widgets
 * </p>
 *
 * <p>
 * Copyright (c) 2011
 * </p>
 * 
 * @author Alexandre Robin
 * @date Aug 27, 2011
 */
public class RNGRendererSWE extends RNGRenderer implements RNGTagVisitor {
	protected final static String STYLE_HREF = "xlink";
	protected final static String STYLE_OBJ = "swe-obj";
	protected final static String SWE_NS = "http://www.opengis.net/swe/1.0.1";

	protected Map<String, String> softTypedProperties;

	public RNGRendererSWE() {
	}

	@Override
	public void visit(RNGElement elt) {
		String eltName = elt.getName();

		if(eltName.equals("DataRecord")){
			renderDataRecord(elt);
		}else if(eltName.equals("field")){
			renderDataRecordField(elt);
		} else if(eltName.equals("Quantity")){
			renderDataRecordQuantity(elt);
		} else if(eltName.equals("name")){
			renderDataRecordName(elt);
		} else if(eltName.equals("uom")) {
			renderDataRecordUOM(elt);
		} else if(eltName.equals("value")) {
			renderDataRecordValue(elt);
		}
		
		else {
			
			
		if (eltName.startsWith("Boolean") || eltName.startsWith("Quantity") || eltName.startsWith("Count") || eltName.startsWith("Category")
				|| eltName.startsWith("Time") || eltName.equals("Text") || eltName.equals("Vector")
				|| eltName.equals("DataArray") || eltName.equals("Matrix") || eltName.equals("DataChoice") || eltName.equals("DataStream")) {
			renderDataComponent(elt);
		}

		else if (eltName.equals("coordinate") || eltName.equals("elementType") || eltName.equals("item")
				|| eltName.equals("quality") || eltName.equals("encoding")) {
			renderDataComponentProperty(elt);
			renderPropertyPanel(elt);
		}

		else if (eltName.equals("identifier") || eltName.equals("label") || eltName.equals("description")
				|| eltName.equals("defaultValue")) {
			renderLabeledField(elt, toNiceLabel(elt.getName()));
		}

		else {
			super.visit(elt);
		}
	 }
	}

	@Override
	public void visit(RNGAttribute att) {
		String attName = att.getName();

		if (attName.equals("name")) {
			RNGAttributeWidget widget = new RNGAttributeWidget(att);
			newWidgetList();
			visitChildren(att.getChildren());
			//should have only 1 element inside
			AbstractSensorWidget child = peek().get(0);
			if(child instanceof RNGValueWidget) {
				pop();
				widget.setValue(child.getName());
			}
			peek().add(widget);
			//peek().get(0).getWidget().setTitle("Enter name");
		}

		else if (attName.equals("code")) {
			visitChildren(att.getChildren());
		}
		
		else if (attName.equals("definition")) {
			RNGAttributeDefinitionWidget widget = new RNGAttributeDefinitionWidget(att);
			newWidgetList();
			this.visitChildren(att.getChildren());
			pop();
			peek().add(widget);
		}

		else {
			renderLabeledField(att, toNiceLabel(att.getName()));
		}
	}

	protected void renderPropertyPanel(RNGElement elt) {
		SWEPropertyWidget propertyPanel = new SWEPropertyWidget(elt);

		newWidgetList();
		visitChildren(elt.getChildren());
		for (AbstractSensorWidget w : pop()) {
			if (w.getWidget().getTitle().equals("Enter name"))
				propertyPanel.addHeader(w.getWidget());
			else
				propertyPanel.addContent(w.getWidget());
		}

		peek().add(propertyPanel);
	}

	protected void renderDataComponentProperty(RNGElement elt) {
		SWEDataComponentPropertyWidget dataComponentPropertyWidget = new SWEDataComponentPropertyWidget(elt);
		// name attribute
		for (RNGTag child : elt.getChildren()) {
			newWidgetList();
			child.accept(this);

			if (peek().size() > 0 && peek().get(0).getWidget().getTitle().equals("Enter name")) {
				// assign name attribute widget to header
				AbstractSensorWidget w = pop().get(0);
				dataComponentPropertyWidget.setHeader(w.getWidget());
			} else {
				for (AbstractSensorWidget w : pop())
					dataComponentPropertyWidget.getContentPanel().add(w.getWidget());
			}
		}

		peek().add(dataComponentPropertyWidget);
	}

	protected void renderDataRecord(RNGElement elt) {
		AbstractSensorWidget widget = new SWEDataRecordWidget();
		for (RNGTag child : elt.getChildren()) {
			newWidgetList();
			child.accept(this);
			for (AbstractSensorWidget w : pop())
				widget.addPanel(w);
		}

		peek().add(widget);
		
	}
	
	protected void renderDataRecordField(RNGElement elt) {
		AbstractSensorWidget widget = new SWEDataFieldWidget();
		for (RNGTag child : elt.getChildren()) {
			newWidgetList();
			child.accept(this);
			for (AbstractSensorWidget w : pop())
				widget.addPanel(w);
		}

		peek().add(widget);
	}
	
	protected void renderDataRecordQuantity(RNGElement elt) {
		AbstractSensorWidget widget = new SWEDataQuantityWidget();
		for (RNGTag child : elt.getChildren()) {
			newWidgetList();
			child.accept(this);
			for (AbstractSensorWidget w : pop())
				widget.addPanel(w);
		}

		peek().add(widget);
	}
	
	protected void renderDataRecordName(RNGElement elt) {
		AbstractSensorWidget widget = new SWEDataRecordNameWidget();
		for (RNGTag child : elt.getChildren()) {
			newWidgetList();
			child.accept(this);
			for (AbstractSensorWidget w : pop())
				widget.addPanel(w);
		}

		peek().add(widget);
	}
	
	/**
	 * Handle XSD values?
	 * @param elt
	 */
	protected void renderDataRecordValue(RNGElement elt) {
		visitChildren(elt.getChildren());

	}
	
	protected void renderDataRecordUOM(RNGElement elt) {
		AbstractSensorWidget widget = new SWEDataRecordUOMWidget();
		for (RNGTag child : elt.getChildren()) {
			newWidgetList();
			child.accept(this);
			for (AbstractSensorWidget w : pop())
				widget.addPanel(w);
		}

		peek().add(widget);
	}
	
	protected void renderDataComponent(RNGElement elt) {
		AbstractSensorWidget widget = new SWEDataComponentWidget(elt);
		peek().add(widget);
		visitChildren(elt.getChildren());
	}

	protected void renderLabeledField(RNGTagList tagList, String label) {
		AbstractSensorWidget widget = new SWELabeledFieldWidget(tagList, label);
		newWidgetList();
		this.visitChildren(tagList.getChildren());
		addWidgetsToWidget(widget);
	}

	protected void renderIdentifierPanel(RNGElement elt) {
		AbstractSensorWidget widget = new RNGIdentifierWidget();
		for (RNGTag child : elt.getChildren()) {
			newWidgetList();
			child.accept(this);
			for (AbstractSensorWidget w : pop())
				widget.addPanel(w);
		}

		peek().add(widget);
	}
	
	@Override
	protected String findLabel(RNGTag tag) {
		if (tag instanceof RNGElement) {
			String eltName = ((RNGElement) tag).getName();
			if (eltName.equals("field") || eltName.equals("item")) {
				RNGAttribute nameAtt = ((RNGElement) tag).getChildAttribute("name");
				RNGValue val = nameAtt.getChildValue();
				if (val != null)
					return val.getText() + " " + toNiceLabel(eltName);
			}
		}

		return super.findLabel(tag);
	}
}