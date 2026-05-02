<?php

namespace ColorSource\ProductionSuite\Core;

use ColorSource\ProductionSuite\Infrastructure\Database\Schema;
use ColorSource\ProductionSuite\Modules\App\AppModule;
use ColorSource\ProductionSuite\Modules\Auth\AuthModule;
use ColorSource\ProductionSuite\Modules\Bootstrap\BootstrapModule;
use ColorSource\ProductionSuite\Modules\Catalog\CatalogModule;
use ColorSource\ProductionSuite\Modules\Ops\OpsModule;
use ColorSource\ProductionSuite\Modules\Orders\OrdersModule;
use ColorSource\ProductionSuite\Modules\People\PeopleModule;

final class Plugin
{
    /** @var Module[] */
    private array $modules;

    public function __construct()
    {
        $this->modules = [
            new AppModule(),
            new BootstrapModule(),
            new AuthModule(),
            new PeopleModule(),
            new CatalogModule(),
            new OrdersModule(),
            new OpsModule(),
        ];
    }

    public function boot(): void
    {
        add_action('init', [$this, 'migrate']);

        foreach ($this->modules as $module) {
            $module->register();
        }
    }

    public function migrate(): void
    {
        (new Schema())->maybeMigrate();
    }
}
