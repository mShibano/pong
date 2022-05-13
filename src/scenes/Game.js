import Phaser from "phaser";

import { GameBackground, GameOver } from "../consts/SceneKeys";
import { White } from "../consts/Colors";
import { PressStart2P } from "../consts/Fonts";
import * as AudioKeys from "../consts/AudioKeys";
// import * as Colors from "../consts/Colors";

const GameState = {
  Running: "running",
  PlayerWon: "player-won",
  AIWon: "ai-won",
};

export default class Game extends Phaser.Scene {
  init() {
    this.gameState = GameState.Running;

    this.paddleRightVelocity = new Phaser.Math.Vector2(0, 0);
    this.leftScore = 0;
    this.rightScore = 0;

    this.paused = false;
  }

  preload() {
    this.load.image("sky", "assets/sky.png");
    // this.load.atlas("hero", "assets/Hero.png", "assets/herosprites.json");
  }
  create() {
    // this.add.image(400, 300, "sky");
    this.scene.run(GameBackground);
    this.scene.sendToBack(GameBackground);

    // this.physics.add.sprite(300, 300, "Hero");

    this.physics.world.setBounds(-100, 0, 1000, 500);

    this.ball = this.add.circle(400, 250, 10, White, 1);
    this.physics.add.existing(this.ball);
    this.ball.body.setCircle(10);
    this.ball.body.setBounce(1, 1);
    this.ball.body.setMaxSpeed(400);

    this.ball.body.setCollideWorldBounds(true, 1, 1);
    this.ball.body.onWorldBounds = true;

    this.paddleLeft = this.add.rectangle(50, 250, 30, 100, White, 1);
    this.physics.add.existing(this.paddleLeft, true);

    this.paddleRight = this.add.rectangle(750, 250, 30, 100, White, 1);
    this.physics.add.existing(this.paddleRight, true);

    //My hero sprite is created here
    // this.anims.create({
    //   key: "standing",
    //   frames: this.anims.generateFrameNames("hero", {
    //     prefix: "stand",
    //     end: 1,
    //     zeroPad: 2,
    //   }),
    //   repeat: -1,
    // });

    // this.anims.create({
    //   key: "walk-up",
    //   frames: this.anims.generateFrameNames("hero", {
    //     prefix: "up",
    //     end: 2,
    //     zeroPad: 2,
    //   }),
    //   repeat: -1,
    // });

    // this.anims.create({
    //   key: "walk-down",
    //   frames: this.anims.generateFrameNames("hero", {
    //     prefix: "down",
    //     end: 2,
    //     zeroPad: 2,
    //   }),
    //   repeat: -1,
    // });

    // this.anims.create({
    //   key: "walk-left",
    //   frames: this.anims.generateFrameNames("hero", {
    //     prefix: "left",
    //     end: 2,
    //     zeroPad: 2,
    //   }),
    //   repeat: -1,
    // });

    // this.anims.create({
    //   key: "walk-right",
    //   frames: this.anims.generateFrameNames("hero", {
    //     prefix: "right",
    //     end: 2,
    //     zeroPad: 2,
    //   }),
    //   repeat: -1,
    // });

    // hero = this.physics.add.sprite(100, 200, "hero");
    // this.physics.add.collider(hero);

    this.physics.add.collider(
      this.paddleLeft,
      this.ball,
      this.handlePaddleBallCollision,
      undefined,
      this
    );
    this.physics.add.collider(
      this.paddleRight,
      this.ball,
      this.handlePaddleBallCollision,
      undefined,
      this
    );

    this.physics.world.on(
      "worldbounds",
      this.handleBallWorldBoundsCollision,
      this
    );

    const scoreStyle = {
      fontSize: 48,
      fontFamily: PressStart2P,
    };

    this.leftScoreLabel = this.add
      .text(300, 125, "0", scoreStyle)
      .setOrigin(0.5, 0.5);
    this.rightScoreLabel = this.add
      .text(500, 375, "0", scoreStyle)
      .setOrigin(0.5, 0.5);
    this.cursors = this.input.keyboard.createCursorKeys();

    this.time.delayedCall(500, () => {
      this.resetBall();
    });
  }
  update() {
    if (this.paused || this.gameState !== GameState.Running) {
      return;
    }

    this.processPlayerInput();
    this.updateAI();
    this.checkScore();
  }

  handleBallWorldBoundsCollision(body, up, down, left, right) {
    if (left || right) {
      return;
    }
    this.sound.play(AudioKeys.PongPlop);

    /**@type {Phaser.Physics.Arcade.Body} */
    const vel = this.ball.body.velocity;
    vel.x *= 1.05;
    vel.y *= 1.05;
    body.setVelocity(vel.x, vel.y);
  }

  handlePaddleBallCollision() {
    this.sound.play(AudioKeys.PongBeep);

    /**@type {Phaser.Physics.Arcade.Body} */
    const body = this.ball.body;
    const vel = body.velocity;
    vel.x *= 1.05;
    vel.y *= 1.05;

    body.setVelocity(vel.x, vel.y);
  }

  processPlayerInput() {
    /**@type {Phaser.Physics.Arcade.StaticBody} */
    const body = this.paddleLeft.body;

    if (this.cursors.up.isDown) {
      this.paddleLeft.y -= 10;
      body.updateFromGameObject();
    } else if (this.cursors.down.isDown) {
      this.paddleLeft.y += 10;
      body.updateFromGameObject();
    }
  }

  updateAI() {
    const diff = this.ball.y - this.paddleRight.y;
    if (Math.abs(diff) < 30) {
      return;
    }
    const aiSpeed = 3;
    if (diff < 0) {
      // ball is above the paddle
      this.paddleRightVelocity.y = -aiSpeed;
      if (this.paddleRightVelocity.y < -10) {
        this.paddleRightVelocity.y = -10;
      }
    } else if (diff > 0) {
      // ball is under the paddle
      this.paddleRightVelocity.y = aiSpeed;
      if (this.paddleRightVelocity.y > 10) {
        this.paddleRightVelocity.y = 10;
      }
    }

    this.paddleRight.y += this.paddleRightVelocity.y;
    this.paddleRight.body.updateFromGameObject();
  }

  checkScore() {
    const x = this.ball.x;
    const leftBounds = -30;
    const rightBounds = 830;
    if (x >= leftBounds && x <= rightBounds) {
      return;
    }

    if (this.ball.x < leftBounds) {
      this.incrementRightScore();
    } else if (this.ball.x > rightBounds) {
      this.incrementLeftScore();
    }

    const maxScore = 3;
    if (this.leftScore >= maxScore) {
      this.gameState = GameState.PlayerWon;
    } else if (this.rightScore >= maxScore) {
      this.gameState = GameState.AIWon;
    }
    if (this.gameState === GameState.Running) {
      this.resetBall();
    } else {
      this.ball.active = false;
      this.physics.world.remove(this.ball.body);

      this.scene.stop(GameBackground);

      this.scene.start(GameOver, {
        leftScore: this.leftScore,
        rightScore: this.rightScore,
      });
    }
  }

  incrementLeftScore() {
    this.leftScore += 1;
    this.leftScoreLabel.text = this.leftScore;
  }
  incrementRightScore() {
    this.rightScore += 1;
    this.rightScoreLabel.text = this.rightScore;
  }

  resetBall() {
    this.ball.setPosition(400, 250);

    const angle = Phaser.Math.Between(0, 360);
    const vec = this.physics.velocityFromAngle(angle, 300);

    this.ball.body.setVelocity(vec.x, vec.y);
  }
}
