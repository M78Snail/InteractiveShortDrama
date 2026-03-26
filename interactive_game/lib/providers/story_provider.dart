import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/story.dart';
import '../models/story_node.dart';

class StoryProvider extends ChangeNotifier {
  Story? _story;
  StoryNode? _currentNode;
  final List<String> _visitedNodes = [];
  final Map<String, dynamic> _gameState = {};
  bool _isLoaded = false;

  Story? get story => _story;
  StoryNode? get currentNode => _currentNode;
  List<String> get visitedNodes => _visitedNodes;
  bool get isLoaded => _isLoaded;
  bool get isAtEnding => _currentNode?.isEnding ?? false;

  Future<void> loadStory(Story story) async {
    _story = story;
    _visitedNodes.clear();
    _gameState.clear();
    await _loadSavedProgress();
    _isLoaded = true;
    notifyListeners();
  }

  Future<void> _loadSavedProgress() async {
    final prefs = await SharedPreferences.getInstance();
    final savedNode = prefs.getString('current_node');
    if (savedNode != null && _story?.nodes.containsKey(savedNode) == true) {
      _currentNode = _story!.nodes[savedNode];
      final visited = prefs.getStringList('visited_nodes') ?? [];
      _visitedNodes.addAll(visited);
    } else {
      _currentNode = _story?.startNode;
    }
  }

  Future<void> _saveProgress() async {
    final prefs = await SharedPreferences.getInstance();
    if (_currentNode != null) {
      prefs.setString('current_node', _currentNode!.id);
      prefs.setStringList('visited_nodes', _visitedNodes);
    }
  }

  void makeChoice(String nextNodeId) {
    if (_story?.nodes.containsKey(nextNodeId) == true) {
      if (_currentNode != null) {
        _visitedNodes.add(_currentNode!.id);
      }
      _currentNode = _story!.nodes[nextNodeId];
      _saveProgress();
      notifyListeners();
    }
  }

  void restart() {
    _currentNode = _story?.startNode;
    _visitedNodes.clear();
    _gameState.clear();
    _saveProgress();
    notifyListeners();
  }

  void setGameState(String key, dynamic value) {
    _gameState[key] = value;
    notifyListeners();
  }

  dynamic getGameState(String key) => _gameState[key];
}
