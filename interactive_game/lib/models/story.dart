import 'story_node.dart';

class Story {
  final String title;
  final String startNodeId;
  final Map<String, StoryNode> nodes;

  Story({
    required this.title,
    required this.startNodeId,
    required this.nodes,
  });

  factory Story.fromJson(Map<String, dynamic> json) {
    final nodesJson = json['nodes'] as Map<String, dynamic>;
    final nodes = <String, StoryNode>{};

    nodesJson.forEach((key, value) {
      nodes[key] = StoryNode.fromJson(key, value as Map<String, dynamic>);
    });

    return Story(
      title: json['title'] as String? ?? '互动游戏',
      startNodeId: json['startNode'] as String? ?? nodes.keys.first,
      nodes: nodes,
    );
  }

  Map<String, dynamic> toJson() {
    final nodesMap = <String, dynamic>{};
    nodes.forEach((key, value) {
      nodesMap[key] = value.toJson();
    });

    return {
      'title': title,
      'startNode': startNodeId,
      'nodes': nodesMap,
    };
  }

  StoryNode? getNode(String id) => nodes[id];

  StoryNode? get startNode => nodes[startNodeId];
}
