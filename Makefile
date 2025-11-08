run-ios:
	npm run ios

open-xcode:
	open ios/aigpstracker.xcodeproj

clean:
	cd ios
	rm -rf Pods
	rm -rf Podfile.lock
	pod install

local-release:
	# eas build --profile local --platform ios
	npx expo export --platform ios
	cp dist/_expo/static/js/ios/*.hbc ios/aigpstracker/main.jsbundle
	cp dist/_expo/static/js/ios/*.hbc ios/main.jsbundle
	# add bundle to xcode project
	# open ios/aigpstracker.xcodeproj