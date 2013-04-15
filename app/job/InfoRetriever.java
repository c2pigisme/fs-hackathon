package job;

import models.VirusInfo;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;

import play.jobs.Every;
import play.jobs.Job;
import play.libs.WS;
import play.libs.WS.HttpResponse;

@Every("10mn")
public class InfoRetriever extends Job {
	
	private static final String host = "http://worldmap3.f-secure.com";
	
	private static Gson gson = new Gson();
	
    public void doJob() {
    	System.out.println("Job is running....");
    	HttpResponse response = WS.url(host + "/api/stream").get();
    	JsonElement e = response.getJson();
    	JsonArray arr = e.getAsJsonObject().get("detections").getAsJsonArray();

    	for(JsonElement elem : arr) {
    		JsonElement newElem = elem.getAsJsonObject().remove("long");
    		elem.getAsJsonObject().add("lng", newElem);
    	}

    	VirusInfo[] info = gson.fromJson(arr, VirusInfo[].class);
    	System.out.println("info length : " + info.length);
    	for(VirusInfo i : info) {
    		i.save();
    	}
    }
    
    
}
