# SideBar Module

A SideBar is a list of Elements: Folder, Launcher, Switch or Interactor.
An Element has an img and a square div (and other things).
These Elements are added to the SideBar at its creation with PreElements: PreFolder, PreLauncher, PreSwitch and PreInteractor.
These PreElements contains nearly all the data except the SideBar in which they are in and the rootSideBar which is the root SideBar.
These 2 last data are stored in the Element class.

new SideBar( orientation, [
    new PreFolder( [
        new PreLauncher( ... )
        new PreSwitch( ... )
    ]),
    new PreInteractor( ... )
])
