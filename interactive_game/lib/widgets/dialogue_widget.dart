import 'package:flutter/material.dart';

class DialogueWidget extends StatelessWidget {
  final String dialogue;
  final String? characterName;

  const DialogueWidget({
    super.key,
    required this.dialogue,
    this.characterName,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.white.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (characterName != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                characterName!,
                style: const TextStyle(
                  color: Colors.amber,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          Text(
            dialogue,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}
