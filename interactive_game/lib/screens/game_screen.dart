import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'package:flutter/services.dart';
import '../providers/story_provider.dart';
import '../models/story.dart';
import '../models/story_node.dart';
import '../widgets/dialogue_widget.dart';
import '../widgets/choice_button.dart';
import '../widgets/video_player_widget.dart';
import 'title_screen.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStory();
  }

  Future<void> _loadStory() async {
    try {
      final jsonString = await rootBundle.loadString('assets/story.json');
      final jsonData = json.decode(jsonString) as Map<String, dynamic>;
      final story = Story.fromJson(jsonData);

      if (mounted) {
        await context.read<StoryProvider>().loadStory(story);
      }
    } catch (e) {
      debugPrint('加载剧本失败: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Consumer<StoryProvider>(
                builder: (context, provider, child) {
                  if (!provider.isLoaded || provider.currentNode == null) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  return _buildGameContent(provider);
                },
              ),
      ),
    );
  }

  Widget _buildGameContent(StoryProvider provider) {
    final node = provider.currentNode!;

    return Column(
      children: [
        _buildAppBar(provider),
        Expanded(
          child: Stack(
            fit: StackFit.expand,
            children: [
              _buildBackground(node),
              if (node.character != null) _buildCharacter(node.character!),
              Column(
                children: [
                  const Spacer(),
                  if (!node.isEnding || node.choices.isNotEmpty)
                    DialogueWidget(
                      dialogue: node.dialogue,
                    ),
                  if (node.isEnding) _buildEnding(node),
                  if (node.choices.isNotEmpty)
                    _buildChoices(node.choices, provider),
                  const SizedBox(height: 24),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAppBar(StoryProvider provider) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.black.withOpacity(0.7),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => _confirmExit(context),
          ),
          Expanded(
            child: Text(
              provider.story?.title ?? '',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
          ),
          IconButton(
            icon: const Icon(Icons.restart_alt, color: Colors.white),
            onPressed: () => _confirmRestart(context, provider),
          ),
        ],
      ),
    );
  }

  Widget _buildBackground(StoryNode node) {
    if (node.type == NodeType.video && node.video != null) {
      return VideoPlayerWidget(
        videoPath: node.video!,
        onVideoComplete: () {},
      );
    } else if (node.background != null) {
      return Image.asset(
        node.background!,
        fit: BoxFit.cover,
      );
    }
    return Container(color: const Color(0xFF1a1a2e));
  }

  Widget _buildCharacter(String characterPath) {
    return Positioned(
      bottom: 100,
      left: 0,
      right: 0,
      child: Center(
        child: Image.asset(
          characterPath,
          height: 400,
          fit: BoxFit.contain,
        ),
      ),
    );
  }

  Widget _buildChoices(List<dynamic> choices, StoryProvider provider) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: choices.asMap().entries.map((entry) {
        final index = entry.key;
        final choice = entry.value;
        return ChoiceButton(
          text: choice.text,
          index: index,
          onTap: () => provider.makeChoice(choice.nextNodeId),
        );
      }).toList(),
    );
  }

  Widget _buildEnding(StoryNode node) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.amber.withOpacity(0.5),
          width: 2,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            node.endingTitle ?? '结局',
            style: const TextStyle(
              color: Colors.amber,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            node.dialogue,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  void _confirmExit(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('返回标题'),
        content: const Text('确定要返回标题画面吗？\n当前进度会自动保存。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('继续游戏'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const TitleScreen()),
              );
            },
            child: const Text('返回标题'),
          ),
        ],
      ),
    );
  }

  void _confirmRestart(BuildContext context, StoryProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('重新开始'),
        content: const Text('确定要重新开始游戏吗？'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              provider.restart();
            },
            child: const Text('重新开始'),
          ),
        ],
      ),
    );
  }
}
