import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:chewie/chewie.dart';

class VideoPlayerWidget extends StatefulWidget {
  final String videoPath;
  final VoidCallback? onVideoComplete;

  const VideoPlayerWidget({
    super.key,
    required this.videoPath,
    this.onVideoComplete,
  });

  @override
  State<VideoPlayerWidget> createState() => _VideoPlayerWidgetState();
}

class _VideoPlayerWidgetState extends State<VideoPlayerWidget> {
  late VideoPlayerController _videoPlayerController;
  ChewieController? _chewieController;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  Future<void> _initializeVideo() async {
    _videoPlayerController = VideoPlayerController.asset(widget.videoPath);

    await _videoPlayerController.initialize();

    _videoPlayerController.addListener(() {
      if (_videoPlayerController.value.position >=
          _videoPlayerController.value.duration) {
        widget.onVideoComplete?.call();
      }
    });

    _chewieController = ChewieController(
      videoPlayerController: _videoPlayerController,
      autoPlay: true,
      looping: false,
      showControls: true,
      allowFullScreen: true,
      materialProgressColors: ChewieProgressColors(
        playedColor: Colors.amber,
        handleColor: Colors.amber,
        backgroundColor: Colors.grey,
        bufferedColor: Colors.grey.withOpacity(0.5),
      ),
    );

    setState(() {
      _isInitialized = true;
    });
  }

  @override
  void dispose() {
    _videoPlayerController.dispose();
    _chewieController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return Chewie(controller: _chewieController!);
  }
}
