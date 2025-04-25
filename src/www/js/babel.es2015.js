"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Bonzi = function () {
	function Bonzi(id, userPublic) {
		var _this2 = this;

		_classCallCheck(this, Bonzi);

		// ========================================================================
		// VARIABLES/CONSTANTS
		// ========================================================================
		this.userPublic = userPublic || {
			name: "BonziBUDDY",
			color: "purple",
			speed: 175,
			pitch: 50,
			voice: "en-us"
		};
		this.color = this.userPublic.color;
		this.colorPrev;
		this.data = window.BonziData;

		this.drag = false;
		this.dragged = false;

		this.eventQueue = [];

		this.eventRun = true;
		this.event = null;

		this.willCancel = false;

		this.run = true;

		this.mute = false;

		this.eventTypeToFunc = {
			"anim": "updateAnim",
			"html": "updateText",
			"text": "updateText",
			"idle": "updateIdle",
			"add_random": "updateRandom"
		};

		// ========================================================================
		// ASSIGN ID
		// http://stackoverflow.com/a/105074
		// ========================================================================

		if (typeof id == "undefined") {
			this.id = s4() + s4();
		} else this.id = id;

		this.rng = new Math.seedrandom(this.seed || this.id || Math.random());

		// ========================================================================
		// HTML POPULATION
		// ========================================================================
		this.selContainer = "#content";
		this.$container = $(this.selContainer);

		this.$container.append("\n\t\t\t<div id='bonzi_" + this.id + "' class='bonzi'>\n\t\t\t\t<div class='bonzi_name'></div>\n\t\t\t\t\t<div class='bonzi_placeholder'></div>\n\t\t\t\t<div style='display:none' class='bubble'>\n\t\t\t\t\t<p class='bubble-content'></p>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t");

		this.selElement = "#bonzi_" + this.id;
		this.selDialog = this.selElement + " > .bubble";
		this.selDialogCont = this.selElement + " > .bubble > p";
		this.selNametag = this.selElement + " > .bonzi_name";

		this.selCanvas = this.selElement + " > .bonzi_placeholder";
		$(this.selCanvas).width(this.data.size.x).height(this.data.size.y);

		this.$element = $(this.selElement);
		this.$canvas = $(this.selCanvas);
		this.$dialog = $(this.selDialog);
		this.$dialogCont = $(this.selDialogCont);
		this.$nametag = $(this.selNametag);

		this.updateName();

		$.data(this.$element[0], "parent", this);

		this.updateSprite(true);

		// ========================================================================
		// EVENTS
		// ========================================================================
		this.generate_event = function (a, b, c) {
			var _this = this;

			// Selector, event, function
			a[b](function (e) {
				_this[c](e);
			});
		};

		this.generate_event(this.$canvas, "mousedown", "mousedown");

		this.generate_event($(window), "mousemove", "mousemove");

		this.generate_event($(window), "mouseup", "mouseup");

		var coords = this.maxCoords();
		this.x = coords.x * this.rng();
		this.y = coords.y * this.rng();
		this.move();

		// ========================================================================
		// MENU
		// ========================================================================

		$.contextMenu({
			selector: this.selCanvas,
			build: function build($trigger, e) {
				return { items: {
						"cancel": {
							name: "Cancel",
							callback: function callback() {
								_this2.cancel();
							}
						},
						"mute": {
							name: function name() {
								return _this2.mute ? "Unmute" : "Mute";
							},
							callback: function callback() {
								_this2.cancel();
								_this2.mute = !_this2.mute;
							}
						},
						"asshole": {
							name: "Call an Asshole",
							callback: function callback() {
								socket.emit("command", {
									list: ["asshole", _this2.userPublic.name]
								});
							}
						},
						"owo": {
							name: "Notice Bulge",
							callback: function callback() {
								socket.emit("command", {
									list: ["owo", _this2.userPublic.name]
								});
							}
						}
					} };
			},
			animation: {
				duration: 175,
				show: 'fadeIn',
				hide: 'fadeOut'
			}
		});

		// ========================================================================
		// UPDATE LOOP
		// ========================================================================

		this.needsUpdate = false;

		this.runSingleEvent([{
			type: "anim",
			anim: "surf_intro",
			ticks: 30
		}]);
	}

	_createClass(Bonzi, [{
		key: "eventMake",
		value: function eventMake(list) {
			return {
				list: list,
				index: 0,
				timer: 0,
				cur: function cur() {
					return this.list[this.index];
				}
			};
		}
	}, {
		key: "mousedown",
		value: function mousedown(e) {
			if (e.which == 1) {
				this.drag = true;
				this.dragged = false;
				this.drag_start = {
					x: e.pageX - this.x,
					y: e.pageY - this.y
				};
			}
		}
	}, {
		key: "mousemove",
		value: function mousemove(e) {
			if (this.drag) {
				this.move(e.pageX - this.drag_start.x, e.pageY - this.drag_start.y);
				this.dragged = true;
			}
		}
	}, {
		key: "move",
		value: function move(x, y) {
			if (arguments.length !== 0) {
				this.x = x;
				this.y = y;
			}
			var max = this.maxCoords();
			this.x = Math.min(Math.max(0, this.x), max.x);
			this.y = Math.min(Math.max(0, this.y), max.y);
			this.$element.css({
				"marginLeft": this.x,
				"marginTop": this.y
			});

			this.sprite.x = this.x;
			this.sprite.y = this.y;
			BonziHandler.needsUpdate = true;
			this.updateDialog();
		}
	}, {
		key: "mouseup",
		value: function mouseup(e) {
			if (!this.dragged && this.drag) this.cancel();

			this.drag = false;
			this.dragged = false;
		}
	}, {
		key: "runSingleEvent",
		value: function runSingleEvent(list) {
			if (!this.mute) this.eventQueue.push(this.eventMake(list));
		}
	}, {
		key: "clearDialog",
		value: function clearDialog() {
			this.$dialogCont.html("");
			this.$dialog.hide();
		}
	}, {
		key: "cancel",
		value: function cancel() {
			this.clearDialog();
			this.stopSpeaking();
			this.eventQueue = [this.eventMake([{ type: "idle" }])];
		}
	}, {
		key: "retry",
		value: function retry() {
			this.clearDialog();
			this.event.timer = 0;
		}
	}, {
		key: "stopSpeaking",
		value: function stopSpeaking() {
			this.goingToSpeak = false;
			try {
				this.voiceSource.stop();
			} catch (e) {}
		}
	}, {
		key: "cancelQueue",
		value: function cancelQueue() {
			this.willCancel = true;
		}
	}, {
		key: "updateAnim",
		value: function updateAnim() {
			if (this.event.timer === 0) this.sprite.gotoAndPlay(this.event.cur().anim);
			this.event.timer++;
			BonziHandler.needsUpdate = true;
			if (this.event.timer >= this.event.cur().ticks) this.eventNext();
		}
	}, {
		key: "updateText",
		value: function updateText() {
			if (this.event.timer === 0) {
				this.$dialog.css("display", "block");
				this.event.timer = 1;
				this.talk(this.event.cur().text, this.event.cur().say, true);
			}

			if (this.$dialog.css("display") == "none") this.eventNext();
		}
	}, {
		key: "updateIdle",
		value: function updateIdle() {
			var goNext = this.sprite.currentAnimation == "idle" && this.event.timer === 0;

			goNext = goNext || this.data.pass_idle.indexOf(this.sprite.currentAnimation) != -1;

			if (goNext) this.eventNext();else {
				if (this.event.timer === 0) {
					this.tmp_idle_start = this.data.to_idle[this.sprite.currentAnimation];
					this.sprite.gotoAndPlay(this.tmp_idle_start);
					this.event.timer = 1;
				}

				if (this.tmp_idle_start != this.sprite.currentAnimation) if (this.sprite.currentAnimation == "idle") this.eventNext();

				BonziHandler.needsUpdate = true;
			}
		}
	}, {
		key: "updateRandom",
		value: function updateRandom() {
			var add = this.event.cur().add;
			var index = Math.floor(add.length * this.rng());

			var e = this.eventMake(add[index]);
			this.eventNext();
			this.eventQueue.unshift(e);
		}
	}, {
		key: "update",
		value: function update() {
			if (!this.run) return;
			// ========================================================================
			// EVENTS
			// "the fun part"
			// ========================================================================

			if (this.eventQueue.length !== 0 && this.eventQueue[0].index >= this.eventQueue[0].list.length) this.eventQueue.splice(0, 1);

			this.event = this.eventQueue[0];

			if (this.eventQueue.length !== 0 && this.eventRun) {
				var eventType = this.event.cur().type;
				try {
					this[this.eventTypeToFunc[eventType]]();
				} catch (e) {
					this.event.index++;
				}
			}

			if (this.willCancel) {
				this.cancel();
				this.willCancel = false;
			}

			if (this.needsUpdate) {
				this.stage.update();
				this.needsUpdate = false;
			}
		}
	}, {
		key: "eventNext",
		value: function eventNext() {
			this.event.timer = 0;
			this.event.index += 1;
		}
	}, {
		key: "talk",
		value: function talk(text, say, allowHtml) {
			var _this3 = this;

			allowHtml = allowHtml || false;
			text = replaceAll(text, "{NAME}", this.userPublic.name);
			text = replaceAll(text, "{COLOR}", this.color);
			if (typeof say !== "undefined") {
				say = replaceAll(say, "{NAME}", this.userPublic.name);
				say = replaceAll(say, "{COLOR}", this.color);
			} else {
				say = text.replace("&gt;", "");
			}

			text = linkify(text);
			var greentext = text.substring(0, 4) == "&gt;" || text[0] == ">";

			this.$dialogCont[allowHtml ? "html" : "text"](text)[greentext ? "addClass" : "removeClass"]("bubble_greentext").css("display", "block");

			this.stopSpeaking();

			this.goingToSpeak = true;

			speak.play(say, {
				"pitch": this.userPublic.pitch,
				"speed": this.userPublic.speed
			}, function () {
				// onended
				_this3.clearDialog();
			}, function (source) {
				if (!_this3.goingToSpeak) source.stop();
				_this3.voiceSource = source;
			});
		}
	}, {
		key: "joke",
		value: function joke() {
			this.runSingleEvent(this.data.event_list_joke);
		}
	}, {
		key: "fact",
		value: function fact() {
			this.runSingleEvent(this.data.event_list_fact);
		}
	}, {
		key: "exit",
		value: function exit(callback) {
			this.runSingleEvent([{
				type: "anim",
				anim: "surf_away",
				ticks: 30
			}]);
			setTimeout(callback, 2000);
		}
	}, {
		key: "deconstruct",
		value: function deconstruct() {
			this.stopSpeaking();
			BonziHandler.stage.removeChild(this.sprite);
			this.run = false;
			this.$element.remove();
		}
	}, {
		key: "updateName",
		value: function updateName() {
			this.$nametag.text(this.userPublic.name);
		}
	}, {
		key: "youtube",
		value: function youtube(vid) {
			if (!this.mute) {
				var tag = "iframe";
				this.$dialogCont.html("\n\t\t\t\t\t<" + tag + " type=\"text/html\" width=\"173\" height=\"173\" \n\t\t\t\t\tsrc=\"https://www.youtube.com/embed/" + vid + "?autoplay=1\" \n\t\t\t\t\tstyle=\"width:173px;height:173px\"\n\t\t\t\t\tframeborder=\"0\"\n\t\t\t\t\tallowfullscreen=\"allowfullscreen\"\n\t\t\t\t\tmozallowfullscreen=\"mozallowfullscreen\"\n\t\t\t\t\tmsallowfullscreen=\"msallowfullscreen\"\n\t\t\t\t\toallowfullscreen=\"oallowfullscreen\"\n\t\t\t\t\twebkitallowfullscreen=\"webkitallowfullscreen\"\n\t\t\t\t\t></" + tag + ">\n\t\t\t\t");
				this.$dialog.show();
			}
		}
	}, {
		key: "backflip",
		value: function backflip(swag) {
			var event = [{
				type: "anim",
				anim: "backflip",
				ticks: 15
			}];
			if (swag) {
				event.push({
					type: "anim",
					anim: "cool_fwd",
					ticks: 30
				});
				event.push({
					type: "idle"
				});
			}
			this.runSingleEvent(event);
		}
	}, {
		key: "updateDialog",
		value: function updateDialog() {
			// ========================================================================
			// DIALOG BOX
			// ========================================================================
			var max = this.maxCoords();
			if (this.data.size.x + this.$dialog.width() > max.x) {
				if (this.y < this.$container.height() / 2 - this.data.size.x / 2) {
					this.$dialog.removeClass("bubble-top").removeClass("bubble-left").removeClass("bubble-right").addClass("bubble-bottom");
				} else {
					this.$dialog.removeClass("bubble-bottom").removeClass("bubble-left").removeClass("bubble-right").addClass("bubble-top");
				}
			} else {
				if (this.x < this.$container.width() / 2 - this.data.size.x / 2) {
					this.$dialog.removeClass("bubble-left").removeClass("bubble-top").removeClass("bubble-bottom").addClass("bubble-right");
				} else {
					this.$dialog.removeClass("bubble-right").removeClass("bubble-top").removeClass("bubble-bottom").addClass("bubble-left");
				}
			}
		}
	}, {
		key: "maxCoords",
		value: function maxCoords() {
			return {
				x: this.$container.width() - this.data.size.x,
				y: this.$container.height() - this.data.size.y - $("#chat_bar").height()
			};
		}
	}, {
		key: "asshole",
		value: function asshole(target) {
			this.runSingleEvent([{
				type: "text",
				text: "Hey, " + target + "!"
			}, {
				type: "text",
				text: "You're a fucking asshole!",
				say: "your a fucking asshole!"
			}, {
				type: "anim",
				anim: "grin_fwd",
				ticks: 15
			}, {
				type: "idle"
			}]);
		}
	}, {
		key: "owo",
		value: function owo(target) {
			this.runSingleEvent([{
				type: "text",
				text: "*notices " + target + "'s BonziBulge\u2122*",
				say: "notices " + target + "s bonzibulge"
			}, {
				type: "text",
				text: "owo, wat dis?",
				say: "oh woah, what diss?"
			}]);
		}
	}, {
		key: "updateSprite",
		value: function updateSprite(hide) {
			var stage = BonziHandler.stage;
			this.cancel();
			stage.removeChild(this.sprite);
			if (this.colorPrev != this.color) {
				delete this.sprite;
				this.sprite = new createjs.Sprite(BonziHandler.spriteSheets[this.color], hide ? "gone" : "idle");
			}
			stage.addChild(this.sprite);
			this.move();
		}
	}]);

	return Bonzi;
}();
//# sourceMappingURL=babel.es2015.js.map
