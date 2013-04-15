package models;

import com.google.code.morphia.annotations.Entity;

import play.modules.morphia.Model;

@Entity("streams")
public class VirusInfo extends Model {
    public String city;
	public String name;
	public String lat;
	public String lng;
	public String country;
	public String type;
	public long lastRetrieve = System.currentTimeMillis();
	public int count;
}
