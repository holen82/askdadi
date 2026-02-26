namespace DadiChatBot.Models;

public class UserPreferences { public string ChatMode { get; set; } = "fun"; }
public class SetChatModeRequest { public string ChatMode { get; set; } = string.Empty; }
public class ChatModeResponse { public string ChatMode { get; set; } = string.Empty; }
