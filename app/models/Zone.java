package models;

import java.util.List;

public class Zone {

	public String name;
	public int count;
	public List<VirusInfo> list;
	
	public Zone(String name, int count, List<VirusInfo> list) {
		this.name = name;
		this.count = count;
		this.list = list;
	}
}
