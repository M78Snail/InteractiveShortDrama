import 'choice.dart';

enum NodeType {
  scene,
  choice,
  ending,
}

enum MediaType {
  image,
  video,
}

class StoryNode {
  final String id;
  final NodeType type;
  final MediaType mediaType;
  final String? background;
  final String? character;
  final String? video;
  final String dialogue;
  final List<Choice> choices;
  final bool autoContinue;
  final String? question;
  final int? timeLimit;
  final bool isEnding;
  final String? endingTitle;

  StoryNode({
    required this.id,
    required this.type,
    required this.mediaType,
    this.background,
    this.character,
    this.video,
    required this.dialogue,
    required this.choices,
    this.autoContinue = false,
    this.question,
    this.timeLimit,
    this.isEnding = false,
    this.endingTitle,
  });

  factory StoryNode.fromJson(String id, Map<String, dynamic> json) {
    final typeStr = json['type'] as String? ?? 'scene';
    final NodeType type;
    switch (typeStr) {
      case 'choice':
        type = NodeType.choice;
        break;
      case 'ending':
        type = NodeType.ending;
        break;
      default:
        type = NodeType.scene;
    }

    final mediaTypeStr = json['mediaType'] as String? ?? 'image';
    final MediaType mediaType;
    switch (mediaTypeStr) {
      case 'video':
        mediaType = MediaType.video;
        break;
      default:
        mediaType = MediaType.image;
    }

    final choicesJson = json['choices'] as List<dynamic>? ?? [];
    final choices = choicesJson
        .map((c) => Choice.fromJson(c as Map<String, dynamic>))
        .toList();

    return StoryNode(
      id: id,
      type: type,
      mediaType: mediaType,
      background: json['background'] as String?,
      character: json['character'] as String?,
      video: json['video'] as String?,
      dialogue: json['dialogue'] as String? ?? '',
      choices: choices,
      autoContinue: json['autoContinue'] as bool? ?? false,
      question: json['question'] as String?,
      timeLimit: json['timeLimit'] as int?,
      isEnding: json['isEnding'] as bool? ?? (type == NodeType.ending),
      endingTitle: json['endingTitle'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'type': type.name,
      'mediaType': mediaType.name,
      'dialogue': dialogue,
      'choices': choices.map((c) => c.toJson()).toList(),
    };

    if (background != null) data['background'] = background;
    if (character != null) data['character'] = character;
    if (video != null) data['video'] = video;
    if (autoContinue) data['autoContinue'] = autoContinue;
    if (question != null) data['question'] = question;
    if (timeLimit != null) data['timeLimit'] = timeLimit;
    if (isEnding) data['isEnding'] = isEnding;
    if (endingTitle != null) data['endingTitle'] = endingTitle;

    return data;
  }
}
