from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="DailyCollectionMetric",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField(unique=True)),
                ("cash_total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("upi_total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("cheque_total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("electronic_total", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("total_collection", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("payment_count", models.PositiveIntegerField(default=0)),
                ("bill_count_cleared", models.PositiveIntegerField(default=0)),
                ("generated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-date"]},
        ),
    ]