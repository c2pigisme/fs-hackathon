package controllers;

import static play.libs.F.Matcher.ClassOf;
import static play.mvc.Http.WebSocketEvent.SocketClosed;
import static play.mvc.Http.WebSocketEvent.TextFrame;
import play.*;
import play.libs.WS;
import play.libs.F.Either;
import play.libs.F.EventStream;
import play.libs.F.Promise;
import play.libs.WS.HttpResponse;
import play.modules.morphia.AggregationResult;
import play.modules.morphia.Model;
import play.mvc.*;
import play.mvc.Http.WebSocketClose;
import play.mvc.Http.WebSocketEvent;

import java.net.UnknownHostException;
import java.util.*;
import java.util.Map.Entry;

import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;
import com.mongodb.AggregationOutput;
import com.mongodb.BasicDBObject;
import com.mongodb.DB;
import com.mongodb.DBCollection;
import com.mongodb.DBObject;
import com.mongodb.MongoClient;

import events.Broadcast;
import events.Broadcast.Alert;
import events.Broadcast.FSEvent;
import events.Broadcast.Join;
import models.*;


public class Application extends Controller {

	public static class WebSocket extends WebSocketController {
		private static Broadcast broadcast = new Broadcast();
	    public static void messaging(String id) {

	    	EventStream<FSEvent> es = broadcast.join(id);
	    	
			while (inbound.isOpen()) {
				Either<WebSocketEvent, FSEvent> event = await(Promise.waitEither(inbound.nextEvent(), es.nextEvent()));
	            for(String eventMsg: TextFrame.match(event._1)) {
	            	System.out.println(eventMsg);
	            	broadcast.alert(eventMsg);
	            }
	            
	            for(WebSocketClose closed: SocketClosed.match(event._1)) {
	            	System.out.println("browser closed");
	            	disconnect();
	            }
	            for(Alert l: ClassOf(Alert.class).match(event._2)) {
	            	System.out.println("broadcast alert: " + l.getMsg());
	            	outbound.send(l.getMsg());
	            }
	            for(Join j: ClassOf(Join.class).match(event._2)) {
	            	
	            }            
			}
		}
	}	
	
	
	private static final String host = "http://worldmap3.f-secure.com";
	
	private static Gson gson = new Gson();
	private static MongoClient mongoClient;
	private static DB db;
	private static DBCollection coll;
	
	
    public static void index() {
        map();
    }
    
    public static void map() {
    	Long id = System.currentTimeMillis();
    	render(id);
    }
    
    public static void start() {
    	HttpResponse response = WS.url(host + "/api/start").get();
    	JsonElement json = response.getJson();
    	JsonObject jo = json.getAsJsonObject();
    	JsonPrimitive v = (JsonPrimitive) jo.remove("stream_url");
    	System.out.println("value : " + v);
    	jo.addProperty("stream_url", v.getAsString().replaceAll(host, ""));
    	v = (JsonPrimitive) jo.remove("top10_24h_url");
    	jo.addProperty("top10_24h_url", v.getAsString().replaceAll(host, ""));
    	v = (JsonPrimitive) jo.remove("histogram_24h_url");
    	jo.addProperty("histogram_24h_url", v.getAsString().replaceAll(host, ""));    
    	renderText(json);
    }

	public static void stream(String ts) {
		String query = ts != null ? "/" + ts : "";
		HttpResponse response = WS.url(host + "/api/stream" + query).get();
    	JsonElement json = response.getJson();
    	renderText(json);
	}

	public static void histogram(String ts) {
		String query = ts != null ? "/" + ts : "";
		HttpResponse response = WS.url(host + "/api/histogram" + query).get();
    	JsonElement json = response.getJson();
    	renderText(json);	
	}

	public static void top10(String ts) {
		String query = ts != null ? "/" + ts : "";
		HttpResponse response = WS.url(host + "/api/top10" + query).get();
    	JsonElement json = response.getJson();
    	renderText(json);
	}

	public static void footprint(Integer n) {
		try {
			if(mongoClient == null) {
				mongoClient = new MongoClient();
				db = mongoClient.getDB("fs");
				coll = db.getCollection("streams");
			}
		} catch (UnknownHostException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		if(n == null) {
			n = 10;
		}
		
		DBObject _id = new BasicDBObject( "_id", "$name");
		_id.put("count", new BasicDBObject( "$sum", 1));
		DBObject sortKey = new BasicDBObject( "count", -1);
		DBObject sort = new BasicDBObject( "$sort", sortKey);
		DBObject limit = new BasicDBObject( "$limit", n);
		DBObject group = new BasicDBObject("$group", _id);
		AggregationOutput output = coll.aggregate(group, sort, limit);
		
		ArrayList list = new ArrayList();
		for(DBObject o : output.results()) {
			
			List<VirusInfo> vinfos = VirusInfo.find("byName", o.get("_id")).limit(10).asList();
			Footprint fp = new Footprint((String)o.get("_id"), (Integer)o.get("count"), vinfos);
			list.add(gson.toJson(fp));
		}
		renderText(list);
	}
	
	public static void zone(Integer n) {
		try {
			if(mongoClient == null) {
				mongoClient = new MongoClient();
				db = mongoClient.getDB("fs");
				coll = db.getCollection("streams");
			}
		} catch (UnknownHostException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		if(n == null) {
			n = 30;
		}
		
		DBObject _id = new BasicDBObject( "_id", "$country");
		_id.put("count", new BasicDBObject( "$sum", 1));
		DBObject sortKey = new BasicDBObject( "count", -1);
		DBObject sort = new BasicDBObject( "$sort", sortKey);
		DBObject limit = new BasicDBObject( "$limit", n);
		DBObject group = new BasicDBObject("$group", _id);
		AggregationOutput output = coll.aggregate(group, sort, limit);
		ArrayList list = new ArrayList();
		for(DBObject o : output.results()) {
			List<VirusInfo> vinfos = VirusInfo.find("byCountry", o.get("_id")).asList();
			System.out.println(vinfos.size());
			Zone z = new Zone((String)o.get("_id"), (Integer)o.get("count"), vinfos);
			list.add(gson.toJson(z));
		}
		renderText(list);		
	}
	
	public static void forecast(Integer hours, Integer lmt) {

		try {
			if(mongoClient == null) {
				mongoClient = new MongoClient();
				db = mongoClient.getDB("fs");
				coll = db.getCollection("streams");
			}
		} catch (UnknownHostException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		
		if(hours == null) {
			hours = 10;
		}
		
		System.out.println("Hours: " + hours );
		System.out.println("limit: " + lmt );
		DBObject _id = new BasicDBObject( "_id", "$name");
		_id.put("count", new BasicDBObject( "$sum", 1));
		DBObject sortKey = new BasicDBObject( "count", -1);
		DBObject sort = new BasicDBObject( "$sort", sortKey);
		DBObject limit = new BasicDBObject( "$limit", lmt);
		DBObject group = new BasicDBObject("$group", _id);
		AggregationOutput output = coll.aggregate(group, sort, limit);
		
		ArrayList list = new ArrayList();
		for(DBObject o : output.results()) {
			List<VirusInfo> vinfos = VirusInfo.find("byName", o.get("_id")).limit(10).asList();
			Forecast fc = new Forecast((String)o.get("_id"), hours);
			list.add(gson.toJson(fc.setHighLL(vinfos).setMidLL(vinfos).setLowLL(vinfos)));
		}
		
		renderText(list);
	}

	public static void clientProxy(String domain) {
		Long id = System.currentTimeMillis();
		render(id, domain);
	}
	
	public static void admin() {
		map();
	}	
    
}