import UIKit
import React

// Created by the withUIScene config plugin — see plugins/withUIScene.js.
// The iOS 26+ SDK requires scene lifecycle adoption; the window is therefore owned here
// rather than in AppDelegate.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
      appDelegate.window = window
      appDelegate.startReactNative(in: window)
    }

    window.makeKeyAndVisible()
  }
}
