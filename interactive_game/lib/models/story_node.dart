import 'choice.dart';

enum NodeType {
  image,
  video,
  ending,
}

class StoryNode {
  final String id;
  final NodeType type;
  final String? background;
  final String? character;
  final String? video;
  final String dialogue;
  final List<Choice> choices;
  final bool isEnding;
  final String? endingTitle;

  StoryNode({
    required this.id,
    required this.type,
    this.background,
    this.character,
    this.video,
    required this.dialogue,
    required this.choices,
    this.isEnding = false,
    this.endingTitle,
  });

  factory StoryNode.fromJson(String id, Map<String, dynamic> json) {
    final typeStr = json['type'] as String? ?? 'image';
    final NodeType type;
    switch (typeStr) {
      case 'video':
        type = NodeType.video;
        break;
      case 'ending':
        type = NodeType.ending;
        break;
      default:
        type = NodeType.image;
    }

    final choicesJson = json['choices'] as List<dynamic>? ?? [];
    final choices = choicesJson
        .map((c) => Choice.fromJson(c as Map<String, dynamic>))
        .toList();

    return StoryNode(
      id: id,
      type: type,
      background: json['background'] as String?,
      character: json['character'] as String?,
      video: json['video'] as String?,
      dialogue: json['dialogue'] as String? ?? '',
      choices: choices,
      isEnding: json['isEnding'] as bool? ?? false,
      endingTitle: json['endingTitle'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = {
      'type': type.name,
      'dialogue': dialogue,
      'choices': choices.map((c) => c.toJson()).toList(),
    };

    if (background != null) data['background'] = background;
    if (character != null) data['character'] = character;
    if (video != null) data['video'] = video;
    if (isEnding) data['isEnding'] = isEnding;
    if (endingTitle != null) data['endingTitle'] = endingTitle;

    return data;
  }
}
