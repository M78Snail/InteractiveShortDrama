class Choice {
  final String text;
  final String nextNodeId;

  Choice({
    required this.text,
    required this.nextNodeId,
  });

  factory Choice.fromJson(Map<String, dynamic> json) {
    return Choice(
      text: json['text'] as String,
      nextNodeId: json['nextNode'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'text': text,
      'nextNode': nextNodeId,
    };
  }
}
