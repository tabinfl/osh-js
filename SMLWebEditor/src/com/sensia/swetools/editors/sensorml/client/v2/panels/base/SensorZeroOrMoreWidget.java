package com.sensia.swetools.editors.sensorml.client.v2.panels.base;

import com.google.gwt.user.client.ui.Panel;
import com.google.gwt.user.client.ui.VerticalPanel;
import com.sensia.relaxNG.RNGZeroOrMore;
import com.sensia.swetools.editors.sensorml.client.v2.AbstractSensorElementWidget;
import com.sensia.swetools.editors.sensorml.client.v2.ISensorWidget;

public class SensorZeroOrMoreWidget extends AbstractSensorElementWidget{

	private VerticalPanel container;
	private RNGZeroOrMore zeroOrMore;
	
	public SensorZeroOrMoreWidget(final RNGZeroOrMore zeroOrMore) {
		super("zeroOrMore", TAG_DEF.RNG, TAG_TYPE.ZERO_OR_MORE);
		
		this.zeroOrMore = zeroOrMore;
		container = new VerticalPanel();
		
		getPanel().add(getAddButtonPanel(zeroOrMore.getAnnotation(),findLabel(zeroOrMore)));
	}

	@Override
	protected void addSensorWidget(ISensorWidget widget) {
		//do nothing
	}

	@Override
	public Panel getPanel() {
		return container;
	}

	@Override
	protected void activeMode(MODE mode) {
		// TODO Auto-generated method stub
		
	}

	@Override
	protected AbstractSensorElementWidget newInstance() {
		return new SensorZeroOrMoreWidget(zeroOrMore);
	}
}