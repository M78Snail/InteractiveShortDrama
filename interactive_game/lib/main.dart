import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/story_provider.dart';
import 'screens/title_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => StoryProvider(),
      child: MaterialApp(
        title: '互动影视游戏',
        debugShowCheckedModeBanner: false,
        theme: ThemeData.dark().copyWith(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.amber,
            brightness: Brightness.dark,
          ),
          scaffoldBackgroundColor: const Color(0xFF1a1a2e),
          useMaterial3: true,
        ),
        home: const TitleScreen(),
      ),
    );
  }
}
