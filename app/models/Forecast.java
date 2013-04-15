package models;

import java.util.List;
import java.util.Random;

public class Forecast {

	public String name;
	public double hLat, hLng;
	public double mLat, mLng;
	public double lLat, lLng;
	public int hours;
	private Random random = new Random();
	
	public Forecast(String name, int hours) {
		this.name = name;
		this.hours = hours > 24 ? 24 : hours;
	}
	
	public Forecast setHighLL(List<VirusInfo> vinfos) {
		double tLat = 0, tLng = 0;
		int size = vinfos.size();
		for(VirusInfo i : vinfos) {
			tLat += Double.parseDouble(i.lat);
			tLng += Double.parseDouble(i.lng);
		}
		this.hLat = (tLat / size) + random.nextInt(hours);
		this.hLng = tLng / size + random.nextInt(hours); 
		return this;		
	}
	public Forecast setMidLL(List<VirusInfo> vinfos) {
		double tLat = 0, tLng = 0;
		int size = 6;
		for(int i=0; i < size; i++) {
			tLat += Double.parseDouble(vinfos.get(i).lat);
			tLng += Double.parseDouble(vinfos.get(i).lng);
		}
		this.mLat = (tLat / size) + random.nextInt(hours);
		this.mLng = (tLng / size) + random.nextInt(hours);	
		return this;
	}
	public Forecast setLowLL(List<VirusInfo> vinfos) {
		double tLat = 0, tLng = 0;
		int size = 2;
		for(int i=0; i < size; i++) {
			tLat += Double.parseDouble(vinfos.get(i).lat);
			tLng += Double.parseDouble(vinfos.get(i).lng);
		}
		this.lLat = (tLat / size) + random.nextInt(hours);
		this.lLng = (tLng / size) + random.nextInt(hours);			
		return this;
	}
}

