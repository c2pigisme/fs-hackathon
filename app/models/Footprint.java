package models;

import java.util.List;

public class Footprint {

	public String name;
	public int count;
	public List<VirusInfo> last10;
	
	public Footprint(String name, int count, List<VirusInfo> last10) {
		this.name = name;
		this.count = count;
		this.last10 = last10;
	}
}
