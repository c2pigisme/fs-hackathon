package events;

import play.libs.F.ArchivedEventStream;
import play.libs.F.EventStream;

public class Broadcast {

	private final ArchivedEventStream<FSEvent> events = new ArchivedEventStream<FSEvent>(500);
	
	public EventStream<FSEvent> alert(String msg) {
		events.publish(new Alert(msg));
		return events.eventStream();
	}

	public EventStream<FSEvent> join(String msg) {
		events.publish(new Join(msg));
		return events.eventStream();
	}
	
	public static class FSEvent {
		public final String name;
		public final Long timestamp = System.currentTimeMillis();
		public FSEvent(String name) {
			this.name = name;
		}
	}

	public static class Join extends FSEvent {

		private String msg;
		
		public Join(String msg) {
			super("Join");
			this.msg = msg;
		}
		
		public String getMsg() {
			return this.msg;
		}
		
	}  
	
	public static class Alert extends FSEvent {

		private String msg;
		
		public Alert(String msg) {
			super("Alert");
			this.msg = msg;
		}
		
		public String getMsg() {
			return this.msg;
		}
		
	}  
}
