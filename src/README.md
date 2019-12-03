Root:
    Loads redux into memory
    Create redux context
    create router context
    Attach prompt on router context
    Attach notifier
App:
    Load required information from server
Multiplexer:
    create navbar
    create router routes

    <Switch>
        dataLoader(check login and load),
            // load data
        {routes.map(route => (
            <Route
                component={
                    compose(
                        boundError(AppError),
                            // NONE
                        redirector,
                            // authenticated:
                            // redirectIf: authenticated => !authenticated;
                            // redirectLink
                        routeSychronizer,
                            // NONE
                        helmet,
                            // title
                        bundle(LoadingRenderer, FailedRenderer),
                    )(Component)
                }
            />
        ))}
    </Switch>
